'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Send } from 'lucide-react'

interface ApplicationFormData {
  name: string
  email: string
  phone?: string
  redditUsername?: string
  reason: string
  vipCommunity: boolean
}

export default function ApplicationForm({ isVIP = false }: { isVIP?: boolean }) {
  const [formData, setFormData] = useState<ApplicationFormData>({
    name: '',
    email: '',
    phone: '',
    redditUsername: '',
    reason: '',
    vipCommunity: isVIP
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!formData.reason.trim()) {
      errors.reason = 'Please tell us why you want to join'
    } else if (formData.reason.trim().length < 20) {
      errors.reason = 'Please provide at least 20 characters'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) return
    
    setSubmitting(true)
    
    try {
      // Here you would typically send to an API endpoint
      // For now, we'll simulate a submission
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // In a real implementation, you would do:
      // const response = await fetch('/api/application', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })
      
      console.log('Application submitted:', formData)
      setSubmitted(true)
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          redditUsername: '',
          reason: '',
          vipCommunity: isVIP
        })
        setSubmitted(false)
      }, 5000)
    } catch (err) {
      setError('Failed to submit application. Please try again.')
      console.error('Error submitting application:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-green-800 mb-2">Application Submitted!</h3>
        <p className="text-green-700">
          Thank you for your interest. We'll review your application and get back to you soon.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {isVIP ? 'Apply to Join Our VIP Community' : 'Apply Now'}
      </h2>
      <p className="text-gray-600 mb-6">
        {isVIP 
          ? 'Join our exclusive VIP community for early access to insights and premium features.'
          : 'Fill out the form below to apply and join our community tracking LifeX mentions.'
        }
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
            {formErrors.name && (
              <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
            />
            {formErrors.email && (
              <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reddit Username (Optional)
            </label>
            <input
              type="text"
              value={formData.redditUsername}
              onChange={(e) => setFormData({ ...formData, redditUsername: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="u/yourusername"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Why do you want to join? <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows={5}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formErrors.reason ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={isVIP 
              ? "Tell us why you're interested in joining our VIP community and what value you can bring..."
              : "Tell us why you're interested in joining our community..."
            }
          />
          {formErrors.reason && (
            <p className="text-red-500 text-sm mt-1">{formErrors.reason}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            Minimum 20 characters ({formData.reason.length} characters)
          </p>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="terms"
            className="mt-1 mr-2"
            required
          />
          <label htmlFor="terms" className="text-sm text-gray-600">
            I agree to the terms and conditions and privacy policy <span className="text-red-500">*</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Application
            </>
          )}
        </button>
      </form>
    </div>
  )
}

