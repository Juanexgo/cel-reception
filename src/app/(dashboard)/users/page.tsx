import { getUsersAction } from "@/actions/user-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewUserDialog } from "@/components/users/new-user-dialog";

const roleConfig: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Administrador", color: "bg-red-100 text-red-800" },
  EMPLOYEE: { label: "Empleado", color: "bg-blue-100 text-blue-800" },
  TECHNICIAN: { label: "Técnico", color: "bg-green-100 text-green-800" },
};

export default async function UsersPage() {
  const users = await getUsersAction();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-gray-500">Gestión de usuarios y técnicos</p>
        </div>
        <NewUserDialog />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No hay usuarios. Cree el primero con el botón de arriba.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const role = roleConfig[user.role] || roleConfig.EMPLOYEE;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={role.color}>{role.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {user.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString("es-MX")}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
