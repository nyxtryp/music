const originalCreateElement = document.createElement.bind(document)

document.createElement = function(tagName, options) {
  const element = originalCreateElement(tagName, options)

  if (String(tagName).toLowerCase() === 'audio') {
    element.crossOrigin = 'anonymous'
  }

  return element
}
