'use client'

import { useRouter } from 'next/navigation'
import { CouponForm } from '../_components/CouponForm'
import { Button } from "@/components/ui/button"

export default function NewCouponPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/coupons')
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Create New Coupon</h1>
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        Back
      </Button>
      <CouponForm onSuccess={handleSuccess} />
    </div>
  )
}

