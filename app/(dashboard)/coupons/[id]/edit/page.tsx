'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMainStore } from '@/stores/mainStore'
import { CouponForm } from '../../_components/CouponForm'
import { Coupon } from '@/types/coupon'
import { Button } from "@/components/ui/button"

export default function EditCouponPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { getCouponById, fetchCoupons } = useMainStore()
  const [coupon, setCoupon] = useState<Coupon | undefined>(undefined)

  useEffect(() => {
    fetchCoupons().then(() => {
      const foundCoupon = getCouponById(id)
      if (foundCoupon) {
        setCoupon(foundCoupon)
      } else {
        router.push('/coupons')
      }
    })
  }, [id, getCouponById, fetchCoupons, router])

  const handleSuccess = () => {
    router.push('/coupons')
  }

  if (!coupon) return <div>Loading...</div>

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Edit Coupon</h1>
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        Back
      </Button>
      <CouponForm coupon={coupon} onSuccess={handleSuccess} />
    </div>
  )
}

