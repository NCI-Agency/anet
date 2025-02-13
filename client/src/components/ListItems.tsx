interface ListItemsProps {
  value: string
}

const ListItems = ({
  value
}: ListItemsProps) => {
  const items = value.split(/\r\n|\r|\n|\v|\f|\u2028|\u2029/)
  if (items.length > 1) {
    return (
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    )
  }
  return (<>
    {value} 
  </>)
}

export default ListItems
