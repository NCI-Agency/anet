const geoLayout = projection => (item, dimensions, viewLocation) => ({
  x: projection(item.coordinates)[0],
  y: projection(item.coordinates)[1],
  width: 30,
  height: 30
})

export default geoLayout
