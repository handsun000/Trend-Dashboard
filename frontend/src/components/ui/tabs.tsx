import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex gap-2 data-horizontal:flex-col", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex items-center justify-center p-1.5 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-xl gap-2 h-auto text-slate-300 shadow-2xl",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 cursor-pointer text-slate-300 hover:text-white disabled:pointer-events-none disabled:opacity-50",
        "data-[active]:bg-gradient-to-r data-[active]:from-emerald-500 data-[active]:to-teal-400 data-[active]:text-slate-950 data-[active]:font-extrabold data-[active]:shadow-lg data-[active]:shadow-emerald-500/20 data-[active]:scale-[1.02]",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none mt-2", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
