export type SelectOption = {
  label: string;
  value: string;
};

export type FieldSchema = {
  type: string;              // "text" | "number" | "select" | "toggle" | "color" ...
  label: string;
  default?: any;
  options?: SelectOption[];  // only for select fields
};

export type BlockSchema = {
  id: string;
  label: string;
  color: string;
  fields: Record<string, FieldSchema>;
};

export type CategorySchema = {
  id: string;
  label: string;
  components: BlockSchema[];
};

export const schemaData: {
  categories: CategorySchema[];
} = {
  "categories": [
    {
      "id": "general",
      "label": "General",
      "components": [
        {
          "id": "print",
          "label": "Print",
          "color": "#3b82f6",
          "fields": {
            "text": { "type": "text", "label": "Text", "default": "Hello world" }
          }
        },
        {
          "id": "graph",
          "label": "Graph",
          "color": "#06b6d4",
          "fields": {
            "variable": { "type": "text", "label": "Variable", "default": "value" },
            "title": { "type": "text", "label": "Title", "default": "Graph" }
          }
        },
        {
          "id": "variable",
          "label": "Variable",
          "color": "#eab308",
          "fields": {
            "variable": { "type": "text", "label": "Variable", "default": "x" },
            "value": { "type": "number", "label": "Value", "default": 0 }
          }
        },
        {
          "id": "sleep",
          "label": "Sleep",
          "color": "#ec4899",
          "fields": {
            "seconds": { "type": "number", "label": "Seconds", "default": 1 }
          }
        },
        {
          "id": "delay",
          "label": "Delay",
          "color": "#a855f7",
          "fields": {
            "milliseconds": { "type": "number", "label": "Milliseconds", "default": 1000 }
          }
        }
      ]
    },

    {
      "id": "loop",
      "label": "Loop",
      "components": [
        {
          "id": "break",
          "label": "Break",
          "color": "#eab308",
          "fields": {}
        },
        {
          "id": "repeat",
          "label": "Repeat",
          "color": "#3b82f6",
          "fields": {
            "times": { "type": "number", "label": "Times", "default": 1 }
          }
        },
        {
          "id": "for_loop",
          "label": "For Loop",
          "color": "#8b5cf6",
          "fields": {
            "variable": { "type": "text", "label": "Variable", "default": "i" },
            "range": { "type": "text", "label": "Range", "default": "range(10)" }
          }
        },
        {
          "id": "while_loop",
          "label": "While Loop",
          "color": "#22c55e",
          "fields": {
            "condition": { "type": "text", "label": "Condition", "default": "True" }
          }
        },
        {
          "id": "forever_loop",
          "label": "Forever Loop",
          "color": "#06b6d4",
          "fields": {}
        }
      ]
    },

    {
      "id": "condition",
      "label": "Condition",
      "components": [
        {
          "id": "if_else",
          "label": "If-Else",
          "color": "#2563eb",
          "fields": {
            "left": { "type": "text", "label": "Left", "default": "" },
            "operator": {
              "type": "select",
              "label": "Operator",
              "default": ">=",
              "options": [
                { "label": "==", "value": "==" },
                { "label": "!=", "value": "!=" },
                { "label": ">=", "value": ">=" },
                { "label": "<=", "value": "<=" },
                { "label": ">", "value": ">" },
                { "label": "<", "value": "<" }
              ]
            },
            "right": { "type": "text", "label": "Right", "default": "" }
          }
        }
      ]
    },

    {
      "id": "gpio",
      "label": "GPIO",
      "components": [
        {
          "id": "gpio_pin",
          "label": "GPIO Pin",
          "color": "#22c55e",
          "fields": {
            "pin": { "type": "number", "label": "Pin", "default": 2 },
            "mode": {
              "type": "select",
              "label": "Mode",
              "default": "OUT",
              "options": [
                { "label": "OUT", "value": "OUT" },
                { "label": "IN", "value": "IN" }
              ]
            }
          }
        },
        {
          "id": "pin_write",
          "label": "Pin Write",
          "color": "#ea580c",
          "fields": {
            "pin": { "type": "number", "label": "Pin", "default": 4 },
            "value": { "type": "toggle", "label": "Value", "default": true }
          }
        },
        {
          "id": "digitalwrite",
          "label": "Digital Write",
          "color": "#f59e0b",
          "fields": {
            "pin": { "type": "number", "label": "Pin", "default": 13 },
            "value": {
              "type": "select",
              "label": "Value",
              "default": "HIGH",
              "options": [
                { "label": "HIGH", "value": "HIGH" },
                { "label": "LOW", "value": "LOW" }
              ]
            }
          }
        },
        {
          "id": "pin_read",
          "label": "Pin Read",
          "color": "#1e3a8a",
          "fields": {
            "pin": { "type": "number", "label": "Pin", "default": 4 },
            "pull": {
              "type": "select",
              "label": "Keep pin",
              "default": "Pin.PULL_DOWN",
              "options": [
                { "label": "Pull Down", "value": "Pin.PULL_DOWN" },
                { "label": "Pull Up", "value": "Pin.PULL_UP" }
              ]
            },
            "store": { "type": "text", "label": "Store in", "default": "value" }
          }
        },
        {
          "id": "pwm",
          "label": "PWM",
          "color": "#7c3aed",
          "fields": {
            "pin": { "type": "number", "label": "Pin", "default": 2 },
            "frequency": { "type": "number", "label": "Frequency", "default": 1000 },
            "duty_cycle": { "type": "number", "label": "Duty Cycle", "default": 512 }
          }
        },
        {
          "id": "adc",
          "label": "ADC",
          "color": "#16a34a",
          "fields": {
            "pin": { "type": "number", "label": "Pin", "default": 34 },
            "store": { "type": "text", "label": "Store in", "default": "value" }
          }
        },
        {
          "id": "neopixel_led",
          "label": "NeoPixel LED",
          "color": "#06b6d4",
          "fields": {
            "pin": { "type": "number", "label": "Pin", "default": 45 },
            "led_index": { "type": "number", "label": "LED Index", "default": 0 },
            "color": { "type": "color", "label": "Color", "default": "#FF0000" }
          }
        },
        {
          "id": "buzzer_tone",
          "label": "Buzzer Tone",
          "color": "#0ea5e9",
          "fields": {
            "pin": { "type": "number", "label": "Buzzer Pin", "default": 8 },
            "tone": { "type": "number", "label": "Tone", "default": 1 }
          }
        }
      ]
    },

    {
      "id": "sensor",
      "label": "Sensor",
      "components": [
        {
          "id": "ultrasonic_sensor",
          "label": "Ultrasonic Sensor",
          "color": "#3b82f6",
          "fields": {
            "trigger_pin": { "type": "number", "label": "Trigger Pin", "default": 1 },
            "echo_pin": { "type": "number", "label": "Echo Pin", "default": 5 },
            "store": { "type": "text", "label": "Store in", "default": "distance" }
          }
        },
        {
          "id": "dht11_sensor",
          "label": "DHT11 Sensor",
          "color": "#38bdf8",
          "fields": {
            "data_pin": { "type": "number", "label": "Data Pin", "default": 4 },
            "temperature": { "type": "text", "label": "Temperature var", "default": "temperature" },
            "humidity": { "type": "text", "label": "Humidity var", "default": "humidity" }
          }
        },
        {
          "id": "ir_sensor",
          "label": "IR Sensor",
          "color": "#fb923c",
          "fields": {
            "data_pin": { "type": "number", "label": "Data Pin", "default": 4 },
            "store": { "type": "text", "label": "Store in", "default": "ir_value" }
          }
        }
      ]
    },

    {
      "id": "motors",
      "label": "Motors",
      "components": [
        {
          "id": "l298_motor",
          "label": "L298 Motor Driver",
          "color": "#ef4444",
          "fields": {
            "in1_pin": { "type": "number", "label": "IN1 Pin", "default": 12 },
            "in2_pin": { "type": "number", "label": "IN2 Pin", "default": 14 },
            "in3_pin": { "type": "number", "label": "IN3 Pin", "default": 27 },
            "in4_pin": { "type": "number", "label": "IN4 Pin", "default": 26 },
            "direction": {
              "type": "select",
              "label": "Direction",
              "default": "Forward",
              "options": [
                { "label": "Forward", "value": "Forward" },
                { "label": "Backward", "value": "Backward" }
              ]
            }
          }
        },
        {
          "id": "servo_motor",
          "label": "Servo Motor",
          "color": "#f97316",
          "fields": {
            "servo_pin": { "type": "number", "label": "Servo Pin", "default": 4 },
            "angle": { "type": "number", "label": "Angle (0–180)", "default": 90 }
          }
        }
      ]
    },

    {
      "id": "display",
      "label": "Display",
      "components": [
        {
          "id": "oled_display",
          "label": "1.3in OLED Display",
          "color": "#8b5cf6",
          "fields": {
            "port": { "type": "text", "label": "Port", "default": "Port 1" },
            "sck_pin": { "type": "number", "label": "SCK Pin", "default": 7 },
            "sda_pin": { "type": "number", "label": "SDA Pin", "default": 6 },
            "rotate": { "type": "number", "label": "Rotate", "default": 0 },
            "top": { "type": "number", "label": "Top", "default": 0 },
            "left": { "type": "number", "label": "Left", "default": 0 },
            "text": { "type": "text", "label": "Text", "default": "Hello world" }
          }
        },
        {
          "id": "play_animation",
          "label": "Play Animation",
          "color": "#3b82f6",
          "fields": {
            "name": { "type": "text", "label": "Animation", "default": "wave" },
            "speed": { "type": "number", "label": "Speed", "default": 1 }
          }
        },
        {
          "id": "show_image",
          "label": "Show Image",
          "color": "#3b82f6",
          "fields": {
            "image": { "type": "text", "label": "Image Path", "default": "" },
            "x": { "type": "number", "label": "X", "default": 0 },
            "y": { "type": "number", "label": "Y", "default": 0 }
          }
        }
      ]
    }
  ]
}
