import NewClaimForm from '../NewClaimForm';

export default function NewClaimFormExample() {
  return (
    <NewClaimForm
      onSubmit={(data) => console.log('Claim submitted:', data)}
      onCancel={() => console.log('Cancelled')}
    />
  );
}
