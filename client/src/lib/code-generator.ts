import type { PlacedBlock, BlockConnection } from "./block-types";
import { schemaData } from "./no-code-blocks";

/**
 * Generates Python code from placed blocks
 */
export class CodeGenerator {
  private blocks: Map<string, PlacedBlock>;
  private connections: BlockConnection[];

  constructor(placedBlocks: PlacedBlock[], connections: BlockConnection[] = []) {
    this.blocks = new Map(placedBlocks.map(b => [b.id, b]));
    this.connections = connections;
  }

  /**
   * Generate Python code from the block structure
   */
  generate(): string {
    const lines: string[] = [];
    const imports = new Set<string>();
    
    if (this.blocks.size === 0) {
      return "# No blocks to generate code from\n";
    }

    // Order blocks by visual position (Y coordinate), respecting connections
    const orderedBlocks = this.orderBlocksByVisualPosition();
    if (orderedBlocks.length === 0) {
      return "# No valid blocks found\n";
    }

    // Track visited blocks to handle loops
    const visited = new Set<string>();

    // Generate code following the ordered sequence
    for (const block of orderedBlocks) {
      if (!visited.has(block.id)) {
        const indentStack: number[] = [0];
        this.generateFromBlock(block.id, lines, visited, indentStack, new Set(), imports);
      }
    }

    // Add imports at the top
    const importLines: string[] = [];
    if (imports.has('time')) importLines.push('import time');
    if (imports.has('machine')) importLines.push('from machine import Pin, PWM, ADC, I2C');
    if (imports.has('neopixel')) importLines.push('from neopixel import NeoPixel');
    if (imports.has('hcsr04')) importLines.push('from hcsr04 import HCSR04');
    if (imports.has('dht')) importLines.push('from dht import DHT11');
    if (imports.has('ssd1306')) importLines.push('from ssd1306 import SSD1306_I2C');

    return [...importLines, '', ...lines].join('\n') || "# No code generated\n";
  }

  /**
   * Order blocks by visual position (Y coordinate), respecting connections
   * This ensures blocks appear in the order they're visually arranged
   */
  private orderBlocksByVisualPosition(): PlacedBlock[] {
    // First, sort all blocks by Y position (top to bottom)
    const sortedByY = Array.from(this.blocks.values()).sort((a, b) => {
      // Primary sort: Y position (top to bottom)
      if (a.y !== b.y) {
        return a.y - b.y;
      }
      // Secondary sort: X position (left to right) for blocks at same Y
      return a.x - b.x;
    });

    // Build a map of connections for quick lookup
    // Separate connections into: nesting (from loops/conditionals) and sequential (from regular blocks)
    const nestingConnectionMap = new Map<string, string[]>();
    const sequentialConnectionMap = new Map<string, string[]>();
    
    for (const conn of this.connections) {
      const fromBlock = this.blocks.get(conn.fromBlockId);
      const isNesting = fromBlock && this.shouldNestContent(fromBlock.blockId);
      
      if (isNesting) {
        // This is a nesting connection (loop/conditional to nested block)
        if (!nestingConnectionMap.has(conn.fromBlockId)) {
          nestingConnectionMap.set(conn.fromBlockId, []);
        }
        nestingConnectionMap.get(conn.fromBlockId)!.push(conn.toBlockId);
      } else {
        // This is a sequential connection (regular block to next block)
        if (!sequentialConnectionMap.has(conn.fromBlockId)) {
          sequentialConnectionMap.set(conn.fromBlockId, []);
        }
        sequentialConnectionMap.get(conn.fromBlockId)!.push(conn.toBlockId);
      }
    }

    // Build reverse map (what blocks point to this block) - only for sequential connections
    const reverseMap = new Map<string, string[]>();
    for (const conn of this.connections) {
      const fromBlock = this.blocks.get(conn.fromBlockId);
      const isNesting = fromBlock && this.shouldNestContent(fromBlock.blockId);
      
      if (!isNesting) {
        // Only track reverse connections for sequential blocks
        if (!reverseMap.has(conn.toBlockId)) {
          reverseMap.set(conn.toBlockId, []);
        }
        reverseMap.get(conn.toBlockId)!.push(conn.fromBlockId);
      }
    }

    // Track which blocks are nested (so we skip them in main ordering)
    const nestedBlocks = new Set<string>();
    for (const [fromId, toIds] of nestingConnectionMap.entries()) {
      for (const toId of toIds) {
        nestedBlocks.add(toId);
      }
    }

    // Order blocks: follow visual order, but respect sequential connections only
    const ordered: PlacedBlock[] = [];
    const visited = new Set<string>();

    // Helper to add a block and its sequential connected chain
    const addBlockAndChain = (block: PlacedBlock) => {
      if (visited.has(block.id)) return;
      
      // Skip nested blocks - they will be processed when we're inside their parent
      // Don't mark them as visited here, so they can be processed inside their parent
      if (nestedBlocks.has(block.id)) {
        return;
      }
      
      visited.add(block.id);
      ordered.push(block);

      // Only follow SEQUENTIAL connections (not nesting connections)
      const connectedIds = sequentialConnectionMap.get(block.id) || [];
      const connectedBlocks = connectedIds
        .map(id => this.blocks.get(id))
        .filter((b): b is PlacedBlock => b !== undefined)
        .filter(b => !nestedBlocks.has(b.id)) // Skip blocks that are nested in loops/conditionals
        .sort((a, b) => {
          if (a.y !== b.y) return a.y - b.y;
          return a.x - b.x;
        });

      for (const connectedBlock of connectedBlocks) {
        addBlockAndChain(connectedBlock);
      }
    };

    // Process blocks in visual order
    for (const block of sortedByY) {
      // Skip nested blocks entirely - they'll be processed inside their parent
      if (nestedBlocks.has(block.id)) {
        continue;
      }
      
      // Only process if it's a starting block (no incoming sequential connections) or hasn't been visited
      const hasIncoming = reverseMap.has(block.id);
      if (!hasIncoming || !visited.has(block.id)) {
        addBlockAndChain(block);
      }
    }

    // Add any remaining unvisited blocks that aren't nested (shouldn't happen, but safety check)
    for (const block of sortedByY) {
      if (!visited.has(block.id) && !nestedBlocks.has(block.id)) {
        ordered.push(block);
      }
    }

    return ordered;
  }

  private generateFromBlock(
    blockId: string,
    lines: string[],
    visited: Set<string>,
    indentStack: number[],
    loopBlocks: Set<string>,
    imports: Set<string>
  ): void {
    if (visited.has(blockId) && !loopBlocks.has(blockId)) {
      return; // Prevent infinite recursion (except in loops)
    }
    
    const block = this.blocks.get(blockId);
    if (!block) return;

    visited.add(blockId);
    const indent = indentStack[indentStack.length - 1];
    const indentStr = ' '.repeat(indent);

    const schemaBlock = this.getBlockSchema(block.blockId);
    if (!schemaBlock) {
      lines.push(`${indentStr}# Unknown block: ${block.blockId}`);
      this.generateNext(block, lines, visited, indentStack, loopBlocks, imports);
      return;
    }

    // Generate code based on block type
    const code = this.generateBlockCode(schemaBlock, block, indentStr, imports);
    if (code) {
      // Handle multi-line code (like imports)
      const codeLines = code.split('\n');
      codeLines.forEach(line => {
        if (line.trim()) lines.push(line);
      });
    }

    // Handle blocks that nest content (loops and conditionals)
    if (this.shouldNestContent(block.blockId)) {
      loopBlocks.add(blockId);
      const nestedIndent = indent + 4;
      indentStack.push(nestedIndent);
      
      // Find nested blocks (blocks connected to this one) - sorted by Y position for consistent order
      const nestedConnections = this.connections.filter(c => c.fromBlockId === block.id);
      const nestedBlocks = nestedConnections
        .map(c => this.blocks.get(c.toBlockId))
        .filter((b): b is PlacedBlock => b !== undefined)
        .sort((a, b) => {
          // Sort by Y position (top to bottom), then X (left to right)
          if (a.y !== b.y) return a.y - b.y;
          return a.x - b.x;
        });
      
      // Generate nested code (inside the loop/if block)
      // Process nested blocks - they should always be processed when inside their parent
      for (const nestedBlock of nestedBlocks) {
        // Allow nested blocks to be processed even if visited (they're inside a parent)
        const wasVisited = visited.has(nestedBlock.id);
        if (!wasVisited) {
          visited.add(nestedBlock.id);
        }
        this.generateFromBlock(nestedBlock.id, lines, visited, indentStack, loopBlocks, imports);
      }
      
      indentStack.pop();
      loopBlocks.delete(blockId);
      // Note: Sequential blocks are handled by the visual ordering function,
      // so we don't need to recursively follow connections here
      return;
    }
  }

  private generateBlockCode(
    schemaBlock: any,
    block: PlacedBlock,
    indent: string,
    imports: Set<string>
  ): string {
    const values = block.fieldValues;
    const blockId = block.blockId;

    switch (blockId) {
      // General blocks
      case 'print':
        return `${indent}print("${values.text || schemaBlock.fields.text.default}")`;
      
      case 'variable':
        return `${indent}${values.variable || schemaBlock.fields.variable.default} = ${values.value ?? schemaBlock.fields.value.default}`;
      
      case 'sleep':
        imports.add('time');
        return `${indent}time.sleep(${values.seconds ?? schemaBlock.fields.seconds.default})`;
      
      case 'graph':
        return `${indent}# Graph: ${values.variable || schemaBlock.fields.variable.default} - ${values.title || schemaBlock.fields.title.default}`;

      // Loop blocks
      case 'for_loop': {
        const varName = values.variable || schemaBlock.fields.variable.default;
        const rangeExpr = values.range || schemaBlock.fields.range.default;
        return `${indent}for ${varName} in ${rangeExpr}:`;
      }

      case 'while_loop': {
        const condition = values.condition || schemaBlock.fields.condition.default;
        return `${indent}while ${condition}:`;
      }

      case 'forever_loop':
        return `${indent}while True:`;

      case 'repeat': {
        const times = values.times || schemaBlock.fields.times.default;
        return `${indent}for _ in range(${times}):`;
      }

      case 'break':
        return `${indent}break`;

      // Condition blocks
      case 'if_else': {
        const left = values.left || '';
        const op = values.operator || schemaBlock.fields.operator.default;
        const right = values.right || '';
        return `${indent}if ${left} ${op} ${right}:`;
      }

      // GPIO blocks
      case 'gpio_pin': {
        imports.add('machine');
        const pin = values.pin ?? schemaBlock.fields.pin.default;
        const mode = values.mode || schemaBlock.fields.mode.default;
        return `${indent}pin_${pin} = Pin(${pin}, Pin.${mode})`;
      }

      case 'pin_write': {
        const pin = values.pin ?? schemaBlock.fields.pin.default;
        const value = values.value ?? schemaBlock.fields.value.default;
        return `${indent}pin_${pin}.value(${value ? 1 : 0})`;
      }

      case 'pin_read': {
        imports.add('machine');
        const pin = values.pin ?? schemaBlock.fields.pin.default;
        const pull = values.pull || schemaBlock.fields.pull.default;
        const store = values.store || schemaBlock.fields.store.default;
        return `${indent}pin_${pin} = Pin(${pin}, Pin.IN, ${pull})\n${indent}${store} = pin_${pin}.value()`;
      }

      case 'pwm': {
        imports.add('machine');
        const pin = values.pin ?? schemaBlock.fields.pin.default;
        const freq = values.frequency ?? schemaBlock.fields.frequency.default;
        const duty = values.duty_cycle ?? schemaBlock.fields.duty_cycle.default;
        return `${indent}pwm_${pin} = PWM(Pin(${pin}), freq=${freq}, duty=${duty})`;
      }

      case 'adc': {
        imports.add('machine');
        const pin = values.pin ?? schemaBlock.fields.pin.default;
        const store = values.store || schemaBlock.fields.store.default;
        return `${indent}adc_${pin} = ADC(Pin(${pin}))\n${indent}${store} = adc_${pin}.read()`;
      }

      case 'neopixel_led': {
        imports.add('machine');
        imports.add('neopixel');
        const pin = values.pin ?? schemaBlock.fields.pin.default;
        const index = values.led_index ?? schemaBlock.fields.led_index.default;
        const color = values.color || schemaBlock.fields.color.default;
        // Convert hex color to RGB
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `${indent}np = NeoPixel(Pin(${pin}), 8)\n${indent}np[${index}] = (${r}, ${g}, ${b})\n${indent}np.write()`;
      }

      case 'buzzer_tone': {
        const pin = values.pin ?? schemaBlock.fields.pin.default;
        const tone = values.tone ?? schemaBlock.fields.tone.default;
        return `${indent}# Buzzer tone on pin ${pin}: ${tone}`;
      }

      // Sensor blocks
      case 'ultrasonic_sensor': {
        imports.add('hcsr04');
        const trigger = values.trigger_pin ?? schemaBlock.fields.trigger_pin.default;
        const echo = values.echo_pin ?? schemaBlock.fields.echo_pin.default;
        const store = values.store || schemaBlock.fields.store.default;
        return `${indent}sensor = HCSR04(trigger_pin=${trigger}, echo_pin=${echo})\n${indent}${store} = sensor.distance_cm()`;
      }

      case 'dht11_sensor': {
        imports.add('machine');
        imports.add('dht');
        const pin = values.data_pin ?? schemaBlock.fields.data_pin.default;
        const tempVar = values.temperature || schemaBlock.fields.temperature.default;
        const humVar = values.humidity || schemaBlock.fields.humidity.default;
        return `${indent}dht = DHT11(Pin(${pin}))\n${indent}dht.measure()\n${indent}${tempVar} = dht.temperature()\n${indent}${humVar} = dht.humidity()`;
      }

      case 'ir_sensor': {
        imports.add('machine');
        const pin = values.data_pin ?? schemaBlock.fields.data_pin.default;
        const store = values.store || schemaBlock.fields.store.default;
        return `${indent}ir_${pin} = Pin(${pin}, Pin.IN)\n${indent}${store} = ir_${pin}.value()`;
      }

      // Motor blocks
      case 'l298_motor': {
        imports.add('machine');
        const in1 = values.in1_pin ?? schemaBlock.fields.in1_pin.default;
        const in2 = values.in2_pin ?? schemaBlock.fields.in2_pin.default;
        const in3 = values.in3_pin ?? schemaBlock.fields.in3_pin.default;
        const in4 = values.in4_pin ?? schemaBlock.fields.in4_pin.default;
        const dir = values.direction || schemaBlock.fields.direction.default;
        return `${indent}motor_in1 = Pin(${in1}, Pin.OUT)\n${indent}motor_in2 = Pin(${in2}, Pin.OUT)\n${indent}motor_in3 = Pin(${in3}, Pin.OUT)\n${indent}motor_in4 = Pin(${in4}, Pin.OUT)\n${indent}# Motor direction: ${dir}`;
      }

      case 'servo_motor': {
        imports.add('machine');
        const pin = values.servo_pin ?? schemaBlock.fields.servo_pin.default;
        const angle = values.angle ?? schemaBlock.fields.angle.default;
        return `${indent}servo = PWM(Pin(${pin}), freq=50)\n${indent}servo.duty(int(((${angle} / 180) * 10) + 2.5))`;
      }

      // Display blocks
      case 'oled_display': {
        imports.add('machine');
        imports.add('ssd1306');
        const port = values.port || schemaBlock.fields.port.default;
        const sck = values.sck_pin ?? schemaBlock.fields.sck_pin.default;
        const sda = values.sda_pin ?? schemaBlock.fields.sda_pin.default;
        const text = values.text || schemaBlock.fields.text.default;
        return `${indent}i2c = I2C(scl=Pin(${sck}), sda=Pin(${sda}))\n${indent}oled = SSD1306_I2C(128, 64, i2c)\n${indent}oled.text("${text}", 0, 0)\n${indent}oled.show()`;
      }

      case 'play_animation':
        return `${indent}# Play animation: ${values.name || schemaBlock.fields.name.default}`;

      case 'show_image':
        return `${indent}# Show image: ${values.image || 'image.png'}`;

      default:
        return `${indent}# Block: ${schemaBlock.label}`;
    }
  }

  private isLoopBlock(blockId: string): boolean {
    return ['for_loop', 'while_loop', 'forever_loop', 'repeat'].includes(blockId);
  }

  private shouldNestContent(blockId: string): boolean {
    // Blocks that should nest their next block with increased indentation
    return ['for_loop', 'while_loop', 'forever_loop', 'repeat', 'if_else'].includes(blockId);
  }

  private getBlockSchema(blockId: string): any {
    for (const category of schemaData.categories) {
      const block = category.components.find(c => c.id === blockId);
      if (block) return block;
    }
    return null;
  }
}

