---
element: code_drawing
title: Diagram
---

A diagram drawn from code, such as a flowchart or a sequence diagram, with Mermaid, PlantUML, Graphviz or Flowchart syntax.

### Fields

- `data.drawingType`: the syntax of the code: `Mermaid`, `PlantUml`, `Graphviz` or `Flowchart`.
- `data.drawingMode`: what the page shows: `Both`, the code and the diagram, `Image`, only the diagram, or `Code`, only the code.
- `data.code`: the code of the diagram.

Its `children` is `[{ "text": "" }]`.

### Example

```json
{
  "type": "code_drawing",
  "data": {
    "drawingType": "Mermaid",
    "drawingMode": "Image",
    "code": "graph TD\n  A[Draft] --> B[Review]\n  B --> C[Published]"
  },
  "children": [{ "text": "" }]
}
```
