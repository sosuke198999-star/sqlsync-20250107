import FilterBar from '../FilterBar';

export default function FilterBarExample() {
  return (
    <FilterBar
      onStatusChange={(status) => console.log('Filter by status:', status)}
    />
  );
}
