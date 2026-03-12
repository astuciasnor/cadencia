import { Card, CardContent } from "@/components/ui/card";
import { ProjectsTree } from "./ProjectsTree";

export function ProjectsPage() {
  return (
    <Card>
      <CardContent className="p-5">
        <ProjectsTree />
      </CardContent>
    </Card>
  );
}
