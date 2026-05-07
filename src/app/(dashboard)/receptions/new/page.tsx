import { getTechniciansAction } from "@/actions/reception-actions";
import { NewReceptionForm } from "@/components/receptions/new-reception-form";

export default async function NewReceptionPage() {
  const technicians = await getTechniciansAction();
  return <NewReceptionForm technicians={technicians} />;
}
