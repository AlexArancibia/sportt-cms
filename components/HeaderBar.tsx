import {  PanelsTopLeft } from "lucide-react"

interface HeaderProps {
  title:string
}
export function HeaderBar({title}:HeaderProps) {
  return(
    <div className='container-section py-[16px] px-4  border-b border-border'>
      <div className="content-section text-primary/80 flex gap-2 items-center">
        <PanelsTopLeft className="h-5 w-5 text-border " />
        <h4 className="text-base">{title}</h4>
      </div> 
    </div>
  )
}