import {
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  Menu,
  Plus,
  Receipt,
  Settings,
  Users,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Resumen", icon: LayoutDashboard },
  { label: "Facturas", icon: Receipt },
  { label: "Clientes", icon: Users },
  { label: "Informes", icon: BarChart3 },
  { label: "Ajustes", icon: Settings },
] as const;

const INVOICES = [
  { id: "F-2041", client: "Marta Ríos", amount: "1.240,00 €", status: "Pagada", tone: "success" },
  {
    id: "F-2042",
    client: "Óptica Lumen",
    amount: "860,50 €",
    status: "Pendiente",
    tone: "neutral",
  },
  { id: "F-2043", client: "Taller Norte", amount: "2.300,00 €", status: "Vencida", tone: "danger" },
  { id: "F-2044", client: "Estudio Babel", amount: "540,00 €", status: "Pagada", tone: "success" },
] as const;

const STATUS_BADGE = {
  Pagada: "success",
  Pendiente: "neutral",
  Vencida: "danger",
} as const;

const STATS = [
  { label: "Facturado este mes", value: "12.480 €", hint: "+12 % frente a octubre" },
  { label: "Pendiente de cobro", value: "2.140 €", hint: "3 facturas abiertas" },
  { label: "Clientes activos", value: "48", hint: "5 nuevos" },
];

/**
 * Galería de componentes de muestra. Todo su aspecto procede de variables CSS
 * publicadas por `ThemeScope`; el componente no fija ningún color ni radio.
 * Se reorganiza con container queries, no con breakpoints de viewport, porque
 * el ancho que importa es el del marco de la vista previa.
 */
export function GalleryApp() {
  const [notification, setNotification] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotification(true);
  }

  return (
    <div className="h-full w-full @container">
      <div className="flex h-full min-h-full flex-col bg-background text-fg">
        <header className="flex items-center justify-between gap-density border-b bg-surface px-density py-[calc(var(--space-unit)*3)]">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-contrast"
            >
              <FileText className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-tight">Nébula</span>
            <span className="hidden text-xs text-muted @md:inline">· panel de facturación</span>
          </div>

          <div className="flex items-center gap-density">
            <button
              type="button"
              onClick={() => setNotification((value) => !value)}
              aria-pressed={notification}
              aria-label="Activar avisos"
              className="rounded-md p-2 text-muted transition-colors hover:bg-background hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Bell aria-hidden="true" className="h-4 w-4" />
            </button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Nueva factura
                </Button>
              </DialogTrigger>
              <InvoiceDialog />
            </Dialog>
          </div>
        </header>

        <div className="flex flex-1 flex-col @2xl:flex-row">
          <nav
            aria-label="Secciones"
            className="hidden w-52 shrink-0 border-r bg-surface p-density @2xl:block"
          >
            <NavList />
          </nav>

          <details className="border-b bg-surface px-density py-2 @2xl:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md p-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
              <Menu aria-hidden="true" className="h-4 w-4" />
              Menú
            </summary>
            <div className="pb-2 pt-1">
              <NavList />
            </div>
          </details>

          <main className="flex-1 p-density">
            <div className="flex flex-wrap items-end justify-between gap-density">
              <div>
                <h2 className="text-xl font-semibold leading-tight">Resumen</h2>
                <p className="text-sm text-muted">Martes, 24 de noviembre · Ejercicio 2026</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm">
                  Exportar
                </Button>
                <Button variant="ghost" size="sm">
                  Ver informe
                </Button>
              </div>
            </div>

            <div className="mt-density space-y-density">
              <Alert variant="success">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-success"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <AlertTitle>Todo en orden</AlertTitle>
                    <AlertDescription>
                      Tres facturas pendientes vencen esta semana. Se enviará un recordatorio
                      automático.
                    </AlertDescription>
                  </div>
                </div>
              </Alert>

              <div className="grid grid-cols-1 gap-density @md:grid-cols-3">
                {STATS.map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="pt-density">
                      <p className="text-xs uppercase tracking-wide text-muted">{stat.label}</p>
                      <p className="mt-1 text-xl font-semibold">{stat.value}</p>
                      <p className="text-xs text-muted">{stat.hint}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-density @3xl:grid-cols-[1.4fr_1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Últimas facturas</CardTitle>
                    <CardDescription>Actualizado hace 4 minutos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/*Tabla en pantallas anchas; tarjetas cuando el marco es estrecho.*/}
                    <div className="hidden @xl:block">
                      <Table>
                        <TableCaption>Facturas emitidas en noviembre</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Factura</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Importe</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {INVOICES.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoice.id}</TableCell>
                              <TableCell>{invoice.client}</TableCell>
                              <TableCell className="tabular-nums">{invoice.amount}</TableCell>
                              <TableCell>
                                <Badge variant={STATUS_BADGE[invoice.status]}>
                                  {invoice.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <ul className="space-y-2 @xl:hidden">
                      {INVOICES.map((invoice) => (
                        <li
                          key={invoice.id}
                          className="flex items-center justify-between gap-3 rounded-md border p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {invoice.id} · {invoice.client}
                            </p>
                            <p className="text-xs tabular-nums text-muted">{invoice.amount}</p>
                          </div>
                          <Badge variant={STATUS_BADGE[invoice.status]}>{invoice.status}</Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Enviar recordatorio</CardTitle>
                    <CardDescription>Se enviará al cliente seleccionado.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      className="space-y-density"
                      onSubmit={handleSubmit}
                      aria-label="Recordatorio"
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor="gallery-email">Correo del cliente</Label>
                        <Input
                          id="gallery-email"
                          name="email"
                          type="email"
                          required
                          placeholder="cliente@ejemplo.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="gallery-template">Plantilla</Label>
                        <Select id="gallery-template" name="template" defaultValue="recordatorio">
                          <option value="recordatorio">Recordatorio de pago</option>
                          <option value="vencida">Factura vencida</option>
                          <option value="gracias">Agradecimiento</option>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="gallery-summary" name="summary" />
                        <Label htmlFor="gallery-summary" className="font-normal">
                          Incluir resumen de la cuenta
                        </Label>
                      </div>
                      <Button type="submit" className="w-full">
                        Enviar recordatorio
                      </Button>
                      {notification ? (
                        <p role="status" className="text-xs text-success">
                          Recordatorio enviado. (Demostración, no se envía nada.)
                        </p>
                      ) : null}
                    </form>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Tamaños de botón</CardTitle>
                  <CardDescription>
                    El tamaño por defecto lo fija el token <code>components.buttonSize</code>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <Button size="sm">Pequeño</Button>
                  <Button size="md">Mediano</Button>
                  <Button size="lg">Grande</Button>
                  <Button variant="outline" size="md">
                    Contorno
                  </Button>
                  <Button variant="ghost" size="md">
                    Fantasma
                  </Button>
                  <Button variant="danger" size="md">
                    Peligro
                  </Button>
                  <Button variant="link" size="md">
                    Enlace
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function NavList() {
  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map((item, index) => (
        <li key={item.label}>
          <a
            href="#galeria"
            aria-current={index === 0 ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              index === 0
                ? "bg-primary text-primary-contrast"
                : "text-muted hover:bg-background hover:text-fg",
            )}
          >
            <item.icon aria-hidden="true" className="h-4 w-4" />
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function InvoiceDialog() {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nueva factura</DialogTitle>
        <DialogDescription>Completa los datos. El total se calcula al guardar.</DialogDescription>
      </DialogHeader>
      <div className="space-y-density">
        <div className="space-y-1.5">
          <Label htmlFor="dialog-client">Cliente</Label>
          <Input id="dialog-client" name="client" placeholder="Nombre o empresa" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dialog-amount">Importe (€)</Label>
          <Input
            id="dialog-amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button>Guardar</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
