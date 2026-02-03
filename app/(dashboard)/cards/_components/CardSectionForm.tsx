"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info, Sliders, LayoutTemplate, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import type { CardSection, CreateCardSectionDto, UpdateCardSectionDto } from "@/types/card"
import { useStores } from "@/hooks/useStores"
import { GeneralForm } from "./GeneralForm"
import { StylesForm } from "./StylesForm"
import { CardsForm } from "./CardsForm"
import { MetadataForm } from "./MetadataForm"
import {
  groupCardSectionErrors,
  type CardSectionValidationError,
} from "@/lib/cardSectionValidation"

interface CardSectionFormProps {
  initialData?: CardSection | null
  onSubmit: (formData: any) => void
  isSubmitting: boolean
  onFormChange?: (formData: any) => void
  validationErrors?: CardSectionValidationError[]
  showValidation?: boolean
}

const scrollbarHideStyle = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`

export function CardSectionForm({
  initialData,
  onSubmit,
  isSubmitting,
  onFormChange,
  validationErrors,
  showValidation = false,
}: CardSectionFormProps) {
  const [activeTab, setActiveTab] = useState("general")
  const { currentStoreId } = useStores()

  const defaultFormData: CreateCardSectionDto = {
    title: "",
    subtitle: "",
    description: "",
    layout: "grid",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    maxCards: 12,
    position: 0,
    isActive: true,
    styles: {
      layout: "grid",
      gridColumns: {
        mobile: 1,
        tablet: 2,
        desktop: 3,
      },
      gap: "1rem",
      padding: "1rem",
      margin: "0",
      carouselOptions: {
        autoplay: true,
        loop: true,
        arrows: true,
        dots: true,
      },
    },
    metadata: {
      tags: [],
      seoTitle: "",
      seoDescription: "",
    },
    cards: [],
  }

  // Convertir initialData (CardSection) a UpdateCardSectionDto
  const convertCardSectionToDto = (cardSection: CardSection | null | undefined): UpdateCardSectionDto | null => {
    if (!cardSection) return null

    return {
      title: cardSection.title,
      subtitle: cardSection.subtitle || undefined,
      description: cardSection.description || undefined,
      layout: cardSection.layout || undefined,
      backgroundColor: cardSection.backgroundColor || undefined,
      textColor: cardSection.textColor || undefined,
      maxCards: cardSection.maxCards || undefined,
      position: cardSection.position,
      isActive: cardSection.isActive,
      styles: cardSection.styles || undefined,
      metadata: cardSection.metadata || undefined,
      cards: cardSection.cards?.map((card) => ({
        title: card.title,
        subtitle: card.subtitle || undefined,
        description: card.description || undefined,
        imageUrl: card.imageUrl || undefined,
        linkUrl: card.linkUrl || undefined,
        linkText: card.linkText || undefined,
        backgroundColor: card.backgroundColor || undefined,
        textColor: card.textColor || undefined,
        position: card.position,
        isActive: card.isActive,
        styles: card.styles || undefined,
        metadata: card.metadata || undefined,
      })),
    }
  }

  const [formData, setFormData] = useState<CreateCardSectionDto | UpdateCardSectionDto>(
    convertCardSectionToDto(initialData) || defaultFormData,
  )

  const updateFormData = (newData: Partial<CreateCardSectionDto | UpdateCardSectionDto>) => {
    const updatedData = { ...formData, ...newData }
    setFormData(updatedData)

    if (onFormChange) {
      onFormChange(updatedData)
    }
  }

  const groupedErrors = useMemo(() => groupCardSectionErrors(validationErrors ?? []), [validationErrors])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  // Definir colores para cada tab
  const tabColors = {
    general: "bg-blue-500",
    styles: "bg-violet-500",
    cards: "bg-emerald-500",
    metadata: "bg-amber-500",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container max-w-6xl py-6 sm:py-8 px-4 sm:px-6"
    >
      <style jsx global>
        {scrollbarHideStyle}
      </style>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6 sm:space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
              <TabsList className="flex w-full sm:w-auto overflow-x-auto scrollbar-hide bg-transparent p-0 rounded-none border-b border-border/30 gap-1 sm:gap-2">
                <TabsTrigger
                  value="general"
                  className={`group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 transition-all duration-200 text-sm sm:text-base font-medium relative`}
                >
                  <div
                    className={`p-1.5 rounded-full bg-blue-500/10 group-data-[state=active]:bg-blue-500/20 group-hover:bg-blue-500/15 transition-colors`}
                  >
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <span className="hidden sm:inline text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    General
                  </span>
                  <span className="sm:hidden text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    1
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="styles"
                  className={`group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 transition-all duration-200 text-sm sm:text-base font-medium relative`}
                >
                  <div
                    className={`p-1.5 rounded-full bg-violet-500/10 group-data-[state=active]:bg-violet-500/20 group-hover:bg-violet-500/15 transition-colors`}
                  >
                    <Sliders className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
                  </div>
                  <span className="hidden sm:inline text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    Estilos
                  </span>
                  <span className="sm:hidden text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    2
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="cards"
                  className={`group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 transition-all duration-200 text-sm sm:text-base font-medium relative`}
                >
                  <div
                    className={`p-1.5 rounded-full bg-emerald-500/10 group-data-[state=active]:bg-emerald-500/20 group-hover:bg-emerald-500/15 transition-colors relative`}
                  >
                    <LayoutTemplate className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                    {formData.cards && formData.cards.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-medium rounded-full bg-emerald-500 text-white border-none"
                      >
                        {formData.cards.length}
                      </Badge>
                    )}
                  </div>
                  <span className="hidden sm:inline text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    Tarjetas
                  </span>
                  <span className="sm:hidden text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    3
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="metadata"
                  className={`group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 transition-all duration-200 text-sm sm:text-base font-medium relative`}
                >
                  <div
                    className={`p-1.5 rounded-full bg-amber-500/10 group-data-[state=active]:bg-amber-500/20 group-hover:bg-amber-500/15 transition-colors`}
                  >
                    <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                  </div>
                  <span className="hidden sm:inline text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    Metadatos
                  </span>
                  <span className="sm:hidden text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    4
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="general" className="mt-0">
              <GeneralForm
                formData={formData}
                updateFormData={updateFormData}
                setActiveTab={setActiveTab}
                errors={showValidation ? groupedErrors.section : undefined}
                showValidation={showValidation}
              />
            </TabsContent>

            <TabsContent value="styles" className="mt-0">
              <StylesForm formData={formData} updateFormData={updateFormData} setActiveTab={setActiveTab} />
            </TabsContent>

            <TabsContent value="cards" className="mt-0">
              <CardsForm
                formData={formData}
                updateFormData={updateFormData}
                setActiveTab={setActiveTab}
                validationErrors={
                  showValidation
                    ? {
                        general: groupedErrors.cardsGeneral,
                        byCard: groupedErrors.cards,
                      }
                    : undefined
                }
                showValidation={showValidation}
              />
            </TabsContent>

            <TabsContent value="metadata" className="mt-0">
              <MetadataForm
                formData={formData}
                updateFormData={updateFormData}
                setActiveTab={setActiveTab}
                isSubmitting={isSubmitting}
              />
            </TabsContent>
          </Tabs>
        </div>
      </form>
    </motion.div>
  )
}
