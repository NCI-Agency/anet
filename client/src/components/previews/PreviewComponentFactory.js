const previewComponents = {}

export const registerPreviewComponent = (model, PreviewComponent) =>
  (previewComponents[model] = PreviewComponent)

const PreviewComponentFactory = model => previewComponents[model]

export default PreviewComponentFactory
