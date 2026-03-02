{showCryptoModal && selectedPlan && (
  <CryptoCheckout
    planName={selectedPlan.name}
    planPrice={selectedPlan.price}
    onSuccess={() => {
      // Обновляем план в контексте
      const planMap: Record<string, Plan> = {
        'Pro': 'pro',
        'Team': 'team',
        'Enterprise': 'enterprise'
      }
      setPlan(planMap[selectedPlan.name])
      setShowCryptoModal(false)
      setShowPricing(false)
    }}
    onClose={() => setShowCryptoModal(false)}
  />
)}
