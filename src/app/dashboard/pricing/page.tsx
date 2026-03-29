"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Check, X, Zap, Star, Rocket } from "lucide-react";
import { useState } from "react";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const plans = [
    {
      name: "Basic",
      icon: Zap,
      price: billingCycle === "monthly" ? 29 : 290,
      period: billingCycle === "monthly" ? "/month" : "/year",
      description: "Perfect for individuals and small teams",
      badge: null,
      cta: "Get Started",
      ctaVariant: "outline",
      features: [
        { name: "Email Intelligence", included: true },
        { name: "Up to 100 emails/month", included: true },
        { name: "Basic document processing", included: true },
        { name: "Up to 5 documents/month", included: true },
        { name: "Meeting detection", included: false },
        { name: "Task management (Basic)", included: true },
        { name: "Up to 2 workflows", included: false },
        { name: "Email support", included: true },
        { name: "API access", included: false },
        { name: "Advanced analytics", included: false },
      ],
    },
    {
      name: "Plus",
      icon: Star,
      price: billingCycle === "monthly" ? 79 : 790,
      period: billingCycle === "monthly" ? "/month" : "/year",
      description: "For growing teams and businesses",
      badge: "POPULAR",
      cta: "Upgrade to Plus",
      ctaVariant: "default",
      features: [
        { name: "Email Intelligence", included: true },
        { name: "Up to 500 emails/month", included: true },
        { name: "Advanced document processing", included: true },
        { name: "Up to 50 documents/month", included: true },
        { name: "Meeting detection & scheduling", included: true },
        { name: "Task management (Full)", included: true },
        { name: "Up to 10 workflows", included: true },
        { name: "Priority email support", included: true },
        { name: "API access (limited)", included: true },
        { name: "Basic analytics", included: true },
      ],
    },
    {
      name: "Pro",
      icon: Rocket,
      price: billingCycle === "monthly" ? 199 : 1990,
      period: billingCycle === "monthly" ? "/month" : "/year",
      description: "For enterprises and power users",
      badge: "BEST VALUE",
      cta: "Contact Sales",
      ctaVariant: "default",
      features: [
        { name: "Email Intelligence", included: true },
        { name: "Unlimited emails/month", included: true },
        { name: "Enterprise document processing", included: true },
        { name: "Unlimited documents/month", included: true },
        { name: "Meeting detection & advanced scheduling", included: true },
        { name: "Task management (Full + Automation)", included: true },
        { name: "Unlimited workflows", included: true },
        { name: "24/7 priority phone & email support", included: true },
        { name: "Full API access & webhooks", included: true },
        { name: "Advanced analytics & reporting", included: true },
      ],
    },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white mb-2">Simple, Transparent Pricing</h1>
        <p className="text-lg text-muted-foreground mb-8">Choose the plan that fits your needs. Upgrade or downgrade anytime.</p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              billingCycle === "monthly"
                ? "bg-emerald-600 text-white"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              billingCycle === "annual"
                ? "bg-emerald-600 text-white"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            Annual <span className="text-xs ml-1 text-green-400">(Save 20%)</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, idx) => {
          const Icon = plan.icon;
          const isPopular = plan.badge === "POPULAR";
          const isBestValue = plan.badge === "BEST VALUE";

          return (
            <div key={idx} className={`relative ${isPopular ? "md:scale-105" : ""}`}>
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                    isBestValue
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30"
                      : "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                  }`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <GlassCard className={`p-8 h-full flex flex-col border ${
                isPopular
                  ? "border-emerald-500/40 bg-gradient-to-br from-white/[0.05] to-emerald-500/5"
                  : "border-white/10 hover:border-white/20"
              } transition-all`}>
                {/* Plan Header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isPopular
                      ? "bg-emerald-600/20 border border-emerald-500/40"
                      : "bg-white/5 border border-white/10"
                  }`}>
                    <Icon className={`w-5 h-5 ${isPopular ? "text-emerald-400" : "text-white"}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => {
                    if (plan.name === "Pro") {
                      window.open("mailto:sales@unified-ai.com", "_blank");
                    } else {
                      alert(`Upgrade to ${plan.name} coming soon!`);
                    }
                  }}
                  className={`w-full mb-8 font-semibold h-10 ${
                    isPopular
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  }`}
                >
                  {plan.cta}
                </Button>

                {/* Features */}
                <div className="space-y-4 flex-1">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Features</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-zinc-600 mt-0.5 shrink-0" />
                        )}
                        <span className={`text-sm line-clamp-2 ${
                          feature.included ? "text-white" : "text-zinc-600"
                        }`}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-white/5">
                  <p className="text-xs text-muted-foreground text-center">
                    {plan.name === "Basic" && "No credit card required"}
                    {plan.name === "Plus" && "7-day free trial"}
                    {plan.name === "Pro" && "Custom implementation"}
                  </p>
                </div>
              </GlassCard>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-20 space-y-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">Everything you need to know about our pricing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              q: "Can I change plans anytime?",
              a: "Yes! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect on your next billing cycle."
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans."
            },
            {
              q: "Is there a free trial?",
              a: "Yes, all paid plans include a 7-day free trial. No credit card required to get started with Basic."
            },
            {
              q: "Do you offer discounts for annual billing?",
              a: "Absolutely! Switch to annual billing and save 20% on any plan. Volume discounts are available for enterprises."
            },
            {
              q: "What's included in API access?",
              a: "Plus includes limited API access (1,000 requests/month). Pro includes unlimited API access with webhooks and priority support."
            },
            {
              q: "Can I get a refund?",
              a: "We offer a 30-day money-back guarantee on all plans. No questions asked if you're not satisfied."
            }
          ].map((faq, idx) => (
            <GlassCard key={idx} className="p-6 border border-white/10 hover:border-white/20 transition-all">
              <h4 className="font-semibold text-white mb-3">{faq.q}</h4>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative mt-20 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 p-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/0 via-emerald-600/5 to-teal-600/0 pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <h3 className="text-2xl font-bold text-white">Ready to get started?</h3>
          <p className="text-muted-foreground mb-6">Join hundreds of teams already using UNIFIED AI to streamline their workflows.</p>
          <div className="flex gap-4 justify-center">
            <Button className="bg-white text-black hover:bg-gray-200 font-semibold">
              Start Free Trial
            </Button>
            <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white">
              Book a Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
