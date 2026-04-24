import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { LayoutDashboard, PlusCircle, Users, Settings, LogOut, BrainCircuit } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { title: 'Prescrever', icon: PlusCircle, path: '/prescrever' },
  { title: 'Pacientes', icon: Users, path: '/pacientes' },
  { title: 'Configurações', icon: Settings, path: '/configuracoes' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" className="border-r border-slate-200 bg-white">
        <SidebarHeader className="p-4 border-b border-slate-100">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-primary transition-opacity hover:opacity-80"
          >
            <BrainCircuit className="h-6 w-6" />
            <span>NeuroDash</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-3">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.path}
                  tooltip={item.title}
                  className="mb-1 transition-colors hover:bg-primary/5 hover:text-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                >
                  <Link to={item.path}>
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-slate-200">
              <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1" />
              <AvatarFallback>DN</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">Dr. Neuro</p>
              <p className="text-xs text-muted-foreground truncate">Clínica Matriz</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center border-b border-slate-200 px-4 md:px-6 gap-4 bg-white shrink-0 sticky top-0 z-10">
          <SidebarTrigger className="text-slate-500 hover:bg-slate-100" />
          <div className="flex-1" />
          <div className="flex items-center gap-3 md:hidden">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1" />
              <AvatarFallback>DN</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-[#f8fafc] p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
