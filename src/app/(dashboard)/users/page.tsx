import { getUsersAction, createUserAction } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

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
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Usuario</DialogTitle>
            </DialogHeader>
            <form
              action={async (formData) => {
                "use server";
                const { createUserAction } = await import("@/actions/user-actions");
                await createUserAction(null, formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input name="name" required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input name="password" type="password" required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select name="role" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="EMPLOYEE">Empleado</SelectItem>
                    <SelectItem value="TECHNICIAN">Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Crear Usuario
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
                  No hay usuarios
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
                      <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
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
