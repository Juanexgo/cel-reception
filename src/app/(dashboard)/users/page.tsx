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
import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { getSession } from "@/lib/auth";

const roleConfig: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Administrador", color: "bg-red-100 text-red-800" },
  EMPLOYEE: { label: "Empleado", color: "bg-blue-100 text-blue-800" },
  TECHNICIAN: { label: "Técnico", color: "bg-green-100 text-green-800" },
};

export default async function UsersPage() {
  const [users, session] = await Promise.all([getUsersAction(), getSession()]);
  const isAdmin = session?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Usuarios</h1>
          <p className="text-sm text-gray-500">Gestión de usuarios y técnicos</p>
        </div>
        {isAdmin && <NewUserDialog />}
      </div>

      {users.length === 0 ? (
        <Card className="py-8 text-center text-sm text-gray-500">
          No hay usuarios. Cree el primero con el botón de arriba.
        </Card>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {users.map((user) => {
              const role = roleConfig[user.role] || roleConfig.EMPLOYEE;
              return (
                <li key={user.id}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-gray-600">
                          {user.email}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge className={`${role.color} text-[11px]`}>
                            {role.label}
                          </Badge>
                          <Badge
                            className={`text-[11px] ${
                              user.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                          <span className="text-[11px] text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString(
                              "es-MX"
                            )}
                          </span>
                        </div>
                      </div>
                      {isAdmin && <EditUserDialog user={user} />}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                  {isAdmin && (
                    <TableHead className="text-right">Acciones</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const role = roleConfig[user.role] || roleConfig.EMPLOYEE;
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="max-w-[24ch] truncate">
                        {user.email}
                      </TableCell>
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
                      <TableCell className="hidden lg:table-cell">
                        {new Date(user.createdAt).toLocaleDateString("es-MX")}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <EditUserDialog user={user} />
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
