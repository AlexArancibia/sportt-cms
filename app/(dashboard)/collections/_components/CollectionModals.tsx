import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CollectionForm } from './CollectionForm'

interface CollectionModalProps {
  onSuccess: () => void
  children: React.ReactNode
}

export function CollectionModal({ onSuccess, children }: CollectionModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSuccess = () => {
    setIsOpen(false)
    onSuccess()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Collection</DialogTitle>
        </DialogHeader>
        <CollectionForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}

