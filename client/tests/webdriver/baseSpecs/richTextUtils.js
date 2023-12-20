export const getRichTextContent = async(
  richTextEditor,
  selector,
  multipleElements,
  index
) => {
  const tags = selector.split(" ")
  const convertedTag = tags.map(tag => convertTagForEditor(tag)).join(" ")
  const convertedSelector = await richTextEditor.$(convertedTag)
  if (multipleElements) {
    return (await convertedSelector.$$(multipleElements))[index]
  }
  return convertedSelector

  function convertTagForEditor(tag) {
    let convertedTag = tag
    // Some tags are deserialized into different tags having the same appearance
    switch (tag) {
      // "b" and "strong" tags are deserialized into "strong" tag
      case "b":
        convertedTag = "strong"
        break
      // "i" and "em" tags are deserialized into "em" tag
      case "i":
        convertedTag = "em"
        break
      // "cite" and "blockquote" tags are deserialized into "blockquote" tag
      case "cite":
        convertedTag = "blockquote"
        break
      // Text content without a tag is wrapped inside a "p" tag
      case "":
        convertedTag = "p"
        break
      default:
        return tag
    }
    return convertedTag
  }
}
