import { Quotation } from "@/lib/types/quotation";

interface QuotationPreviewProps {
  quotation: Quotation;
}

/**
 * Professional Quotation Preview Component
 * Matches the exact format of the job portal quotation template
 */
export function QuotationPreview({ quotation }: QuotationPreviewProps) {
  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white text-black p-8 max-w-4xl mx-auto print:p-4 print:max-w-full relative">
      {/* Decorative Top Border */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600"></div>
      
      {/* Header with Design */}
      <div className="border-b-4 border-blue-600 pb-6 mb-8 mt-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-t-lg mb-3">
              <h1 className="text-3xl font-bold tracking-wide">PROJECT QUOTATION</h1>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <p className="text-sm font-semibold text-gray-700">CLIENT NAME: <span className="text-gray-900">{quotation.client.name}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <p className="text-sm text-gray-600">PREPARED ON: <span className="text-gray-900">{formatDate(quotation.project.preparedOn)}</span></p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <p className="text-sm font-semibold text-gray-700">PROJECT NAME: <span className="text-gray-900">{quotation.project.name}</span></p>
              </div>
            </div>
          </div>
          <div className="text-right ml-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
              <h2 className="text-2xl font-bold text-blue-900 mb-1">Solving Club</h2>
              <div className="w-16 h-1 bg-blue-600 mx-auto mb-2"></div>
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">SOFTWARE AGENCY</p>
              <div className="mt-3 space-y-1 text-xs text-gray-700">
                <p className="font-medium">{quotation.agency.address}</p>
                <p>📞 {quotation.agency.phone}</p>
                <p>✉️ {quotation.agency.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">01</div>
          <h3 className="text-xl font-bold text-gray-900">Overview</h3>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-600 to-transparent"></div>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
          <p className="text-sm leading-relaxed mb-4 text-gray-700">{quotation.project.overview}</p>
          {quotation.project.features.length > 0 && (
            <ul className="list-none text-sm space-y-2">
              {quotation.project.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-1">✓</span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Project Scope */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">02</div>
          <h3 className="text-xl font-bold text-gray-900">Project Scope</h3>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-600 to-transparent"></div>
        </div>
        <p className="text-sm mb-6 text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
          The project is divided into <span className="font-bold text-blue-600">{quotation.phases.length}</span> structured phases, each containing clear milestones and measurable deliverables.
        </p>
        
        {quotation.phases.map((phase, phaseIdx) => (
          <div key={phase.id} className={`mb-6 ${phaseIdx !== quotation.phases.length - 1 ? 'border-b border-gray-200 pb-6' : ''}`}>
            <div className="bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border-l-4 border-blue-600 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">PHASE {phase.number}</span>
                <h4 className="text-lg font-semibold text-gray-900">
                  {phase.name}
                </h4>
              </div>
              <p className="text-sm text-gray-700">{phase.description}</p>
            </div>
            {phase.deliverables.length > 0 && (
              <div className="mb-4 bg-white p-3 rounded border border-gray-200">
                <p className="text-sm font-semibold mb-2 text-blue-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  Deliverables:
                </p>
                <ul className="list-none text-sm space-y-1.5">
                  {phase.deliverables.map((deliverable) => (
                    <li key={deliverable.id} className="flex items-start gap-2 text-gray-700">
                      <span className="text-blue-500 mt-1">▸</span>
                      <span>{deliverable.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {phase.features.length > 0 && (
              <div className="space-y-3">
                {phase.features.map((feature, featIdx) => (
                  <div key={featIdx} className="text-sm bg-white p-3 rounded border border-gray-200">
                    {feature.category && (
                      <p className="font-semibold mb-2 text-gray-900">{feature.category}:</p>
                    )}
                    <ul className="list-none space-y-1.5">
                      {feature.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2 text-gray-700">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {phase.duration && (
              <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  <strong className="text-blue-900">Projected Duration:</strong> <span className="font-semibold">{phase.duration}</span> ({phase.dateRange})
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Deliverables Summary */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">03</div>
          <h3 className="text-xl font-bold text-gray-900">Deliverables Summary</h3>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-600 to-transparent"></div>
        </div>
        <div className="overflow-hidden rounded-lg border-2 border-gray-300 shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <th className="px-4 py-3 text-left font-semibold">Phase</th>
                <th className="px-4 py-3 text-left font-semibold">Deliverable</th>
              </tr>
            </thead>
          <tbody>
            {quotation.phases.map((phase, phaseIdx) =>
              phase.deliverables.map((deliverable, idx) => (
                <tr key={`${phase.id}-${deliverable.id}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 border-b border-gray-200 font-medium text-gray-700">
                    {idx === 0 && <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">Phase {phase.number}</span>}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-200 text-gray-700">{deliverable.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">04</div>
          <h3 className="text-xl font-bold text-gray-900">Timeline & Key Dates</h3>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-600 to-transparent"></div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">
          <div className="space-y-3 text-sm">
            {quotation.phases.map((phase) => (
              <div key={phase.id} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200 shadow-sm">
                <span className="font-semibold text-gray-900">PHASE {phase.number} - {phase.name.toUpperCase()}</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-medium">{phase.duration} ({phase.dateRange})</span>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t-2 border-blue-600 bg-blue-600 text-white p-4 rounded-lg">
              <div className="flex justify-between items-center font-bold">
                <span>TOTAL PROJECT DURATION:</span>
                <span className="text-lg">
                  {quotation.phases.reduce((total, phase) => {
                    const match = phase.duration.match(/\d+/);
                    return total + (match ? parseInt(match[0]) : 0);
                  }, 0)} DAYS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">05</div>
          <h3 className="text-xl font-bold text-gray-900">Pricing</h3>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-600 to-transparent"></div>
        </div>
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg border-2 border-blue-800">
            <h4 className="font-semibold mb-3 text-blue-100">5.1 Full Project Price</h4>
            <p className="text-4xl font-bold mb-2">
              {formatCurrency(quotation.pricing.totalPrice, quotation.pricing.currency)}
            </p>
            <p className="text-sm text-blue-100">(one-time, all phases included)</p>
            {quotation.pricing.includes.length > 0 && (
              <div className="mt-4 bg-blue-800/50 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2 text-blue-100">Includes:</p>
                <ul className="list-none text-sm space-y-2">
                  {quotation.pricing.includes.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-blue-50">
                      <span className="text-blue-200 mt-1">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {quotation.pricing.addOns.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold mb-3 text-gray-900">5.2 Optional Add-ons</h4>
              <div className="space-y-3">
                {quotation.pricing.addOns.map((addOn) => (
                  <div key={addOn.id} className="bg-white border-2 border-gray-200 p-4 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{addOn.name}</p>
                        {addOn.description && (
                          <p className="text-sm text-gray-600 mt-1">{addOn.description}</p>
                        )}
                      </div>
                      <p className="font-bold text-blue-600 text-lg ml-4">{formatCurrency(addOn.price, quotation.pricing.currency)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Terms */}
      {quotation.payment.schedule.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">06</div>
            <h3 className="text-xl font-bold text-gray-900">Payment Terms</h3>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-600 to-transparent"></div>
          </div>
          <div className="mb-4">
            <h4 className="font-semibold mb-2">6.1 Payment Structure</h4>
            <p className="text-sm mb-4">
              The total project cost of {formatCurrency(quotation.pricing.totalPrice, quotation.pricing.currency)} will be paid on a weekly basis over the project duration.
            </p>
          </div>
          <div className="mb-4">
            <h4 className="font-semibold mb-3 text-gray-900">6.2 Weekly Payment Schedule</h4>
            <div className="overflow-hidden rounded-lg border-2 border-gray-300 shadow-sm">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="px-4 py-3 text-left font-semibold">Week</th>
                    <th className="px-4 py-3 text-left font-semibold">Project Coverage</th>
                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.payment.schedule.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 border-b border-gray-200 font-medium text-gray-700">{item.week}</td>
                      <td className="px-4 py-3 border-b border-gray-200 text-gray-700">{item.coverage}</td>
                      <td className="px-4 py-3 border-b border-gray-200 text-right font-semibold text-gray-900">
                        {formatCurrency(item.amount, quotation.pricing.currency)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gradient-to-r from-blue-100 to-blue-50 border-t-2 border-blue-600">
                    <td colSpan={2} className="px-4 py-3 text-right text-gray-900">Total</td>
                    <td className="px-4 py-3 text-right text-blue-700 text-lg">
                      {formatCurrency(
                        quotation.payment.schedule.reduce((sum, item) => sum + item.amount, 0),
                        quotation.pricing.currency
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {quotation.payment.terms.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold mb-3 text-gray-900">6.3 Payment Terms & Conditions</h4>
              <ul className="list-none text-sm space-y-2">
                {quotation.payment.terms.map((term, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Client Responsibilities */}
      {quotation.clientResponsibilities.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">07</div>
            <h3 className="text-xl font-bold text-gray-900">Client Responsibilities & Assumptions</h3>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-600 to-transparent"></div>
          </div>
          <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold mb-3 text-gray-900">7.1 Client Will Provide</h4>
            <ol className="list-none text-sm space-y-2">
              {quotation.clientResponsibilities.map((resp, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                  <span>{resp}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Assumptions */}
      {quotation.assumptions.length > 0 && (
        <div className="mb-8">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold mb-3 text-gray-900">7.2 Assumptions</h3>
            <ul className="list-none text-sm space-y-2">
              {quotation.assumptions.map((assumption, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-blue-600 font-bold mt-1">→</span>
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Validity */}
      {quotation.validity && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-yellow-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⏰</span>
              <h3 className="text-lg font-bold text-gray-900">Validity</h3>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              This quotation is valid for <span className="font-bold text-blue-600">{quotation.validity}</span> from the date of issue ({formatDate(quotation.project.preparedOn)}).
            </p>
            <p className="text-sm text-gray-600">
              Prices and terms are subject to change after the validity period.
            </p>
          </div>
        </div>
      )}

      {/* Signatures */}
      {quotation.signatures && (
        <div className="mb-8 mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">13</div>
            <h3 className="text-xl font-bold text-gray-900">Acceptance</h3>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-600 to-transparent"></div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <p className="text-sm text-gray-700 text-center">
              By signing below, both parties agree to the terms, scope, pricing, and timeline outlined in this quotation.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
              <p className="font-semibold mb-3 text-gray-900 text-sm">SIGNATURE OF AGENCY:</p>
              {quotation.signatures.agency && (
                <div className="border-t-2 border-blue-600 pt-3">
                  <img
                    src={quotation.signatures.agency.signature}
                    alt="Agency Signature"
                    className="h-16 mb-2 mx-auto"
                  />
                  <p className="text-sm font-semibold text-center text-gray-900">{quotation.signatures.agency.name}</p>
                  <p className="text-xs text-gray-600 text-center">{quotation.signatures.agency.designation}</p>
                  <p className="text-xs text-gray-600 text-center mt-1">Date: {formatDate(quotation.signatures.agency.date)}</p>
                </div>
              )}
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
              <p className="font-semibold mb-3 text-gray-900 text-sm">SIGNATURE OF CLIENT:</p>
              {quotation.signatures.client && (
                <div className="border-t-2 border-blue-600 pt-3">
                  <img
                    src={quotation.signatures.client.signature}
                    alt="Client Signature"
                    className="h-16 mb-2 mx-auto"
                  />
                  <p className="text-sm font-semibold text-center text-gray-900">{quotation.signatures.client.name}</p>
                  <p className="text-xs text-gray-600 text-center">{quotation.signatures.client.designation}</p>
                  <p className="text-xs text-gray-600 text-center mt-1">Date: {formatDate(quotation.signatures.client.date)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t-4 border-blue-600">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg text-center">
          <p className="font-bold text-lg mb-3">THANK YOU!</p>
          <p className="text-sm text-blue-50 mb-4">
            We look forward to partnering with you on this exciting project. Our team is committed to delivering a high-quality, feature-rich solution.
          </p>
          <div className="bg-blue-800/50 p-4 rounded-lg mt-4">
            <p className="text-xs text-blue-100 mb-2">For any questions or clarifications, please contact:</p>
            <p className="font-bold text-white">Solving Club</p>
            <p className="text-xs text-blue-100 mt-1">{quotation.agency.email} | {quotation.agency.phone} | {quotation.agency.address}</p>
          </div>
        </div>
        <div className="text-center mt-4">
          <div className="inline-block bg-gray-200 px-4 py-2 rounded">
            <p className="text-xs font-semibold text-gray-600">END OF DOCUMENT</p>
          </div>
        </div>
      </div>
      
      {/* Decorative Bottom Border */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600"></div>
    </div>
  );
}
