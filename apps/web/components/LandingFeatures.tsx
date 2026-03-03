'use client'

export function LandingFeatures() {
  const features = [
    {
      icon: '🕸️',
      title: '3D Circuit Graph',
      description: 'Explore your ZK circuit in full 3D. Rotate, zoom, and inspect every node and connection.',
    },
    {
      icon: '🔥',
      title: 'Heatmap',
      description: 'Identify computationally expensive constraints with color-coded complexity visualization.',
    },
    {
      icon: '⏱️',
      title: 'Hardware Preview',
      description: 'Simulate FPGA execution cycle by cycle. Optimize your circuit before synthesis.',
    },
    {
      icon: '🐛',
      title: 'Step Debugger',
      description: 'Trace witness generation step by step. Debug your circuit logic with ease.',
    },
    {
      icon: '📤',
      title: 'Export',
      description: 'Save your visualizations as PNG or SVG for documentation and presentations.',
    },
    {
      icon: '🔒',
      title: 'Enterprise Ready',
      description: 'SSO, audit logs, on-premise deployment, and dedicated support for teams.',
    },
  ]

  return (
    <section className="py-16 px-4 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-white mb-4">
        Powerful features for ZK developers
      </h2>
      <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
        Everything you need to visualize, debug, and optimize your Circom circuits.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="bg-bg-light p-6 rounded-lg border border-primary/20 hover:border-primary/50 transition-all hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-gray-400 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <a
          href="/pricing"
          className="inline-block px-8 py-3 bg-primary text-black font-semibold rounded-lg hover:bg-primary-dark transition-colors"
        >
          View Pricing
        </a>
      </div>
    </section>
  )
}
