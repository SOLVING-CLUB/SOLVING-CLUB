import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Quotation, QuotationPhase, PhaseDeliverable, PhaseFeature, PricingAddOn, PaymentScheduleItem } from "@/lib/types/quotation";

const quotationFormSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientAddress: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional().or(z.literal("")),
  projectName: z.string().min(1, "Project name is required"),
  preparedOn: z.string().min(1, "Prepared date is required"),
  overview: z.string().min(1, "Overview is required"),
  totalPrice: z.number().min(0, "Price must be positive"),
  currency: z.string().min(1, "Currency is required"),
  validity: z.string().optional(),
});

interface QuotationFormProps {
  onSubmit: (data: Partial<Quotation>) => void;
  initialData?: Partial<Quotation>;
  isLoading?: boolean;
}

export function QuotationForm({ onSubmit, initialData, isLoading }: QuotationFormProps) {
  const [phases, setPhases] = useState<QuotationPhase[]>(
    initialData?.phases || [
      {
        id: '1',
        number: 1,
        name: '',
        description: '',
        duration: '',
        dateRange: '',
        deliverables: [{ id: '1', description: '' }],
        features: [{ category: '', items: [''] }],
      },
    ]
  );

  const [features, setFeatures] = useState<string[]>(initialData?.project?.features || ['']);
  const [includes, setIncludes] = useState<string[]>(initialData?.pricing?.includes || ['']);
  const [addOns, setAddOns] = useState<PricingAddOn[]>(initialData?.pricing?.addOns || []);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>(
    initialData?.payment?.schedule || []
  );
  const [paymentTerms, setPaymentTerms] = useState<string[]>(initialData?.payment?.terms || ['']);
  const [clientResponsibilities, setClientResponsibilities] = useState<string[]>(
    initialData?.clientResponsibilities || ['']
  );
  const [assumptions, setAssumptions] = useState<string[]>(initialData?.assumptions || ['']);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      clientName: initialData?.client?.name || '',
      clientAddress: initialData?.client?.address || '',
      clientPhone: initialData?.client?.phone || '',
      clientEmail: initialData?.client?.email || '',
      projectName: initialData?.project?.name || '',
      preparedOn: initialData?.project?.preparedOn || new Date().toISOString().split('T')[0],
      overview: initialData?.project?.overview || '',
      totalPrice: initialData?.pricing?.totalPrice || 0,
      currency: initialData?.pricing?.currency || 'INR',
      validity: initialData?.validity || '20 days from the date of issue',
    },
  });

  const addPhase = () => {
    setPhases([
      ...phases,
      {
        id: Date.now().toString(),
        number: phases.length + 1,
        name: '',
        description: '',
        duration: '',
        dateRange: '',
        deliverables: [{ id: '1', description: '' }],
        features: [{ category: '', items: [''] }],
      },
    ]);
  };

  const removePhase = (id: string) => {
    if (phases.length > 1) {
      const updated = phases.filter(p => p.id !== id).map((p, idx) => ({ ...p, number: idx + 1 }));
      setPhases(updated);
    }
  };

  const updatePhase = (id: string, updates: Partial<QuotationPhase>) => {
    setPhases(phases.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addDeliverable = (phaseId: string) => {
    setPhases(phases.map(p =>
      p.id === phaseId
        ? { ...p, deliverables: [...p.deliverables, { id: Date.now().toString(), description: '' }] }
        : p
    ));
  };

  const removeDeliverable = (phaseId: string, deliverableId: string) => {
    setPhases(phases.map(p =>
      p.id === phaseId
        ? { ...p, deliverables: p.deliverables.filter(d => d.id !== deliverableId) }
        : p
    ));
  };

  const addFeature = (phaseId: string) => {
    setPhases(phases.map(p =>
      p.id === phaseId
        ? { ...p, features: [...p.features, { category: '', items: [''] }] }
        : p
    ));
  };

  const addFeatureItem = (phaseId: string, featureIndex: number) => {
    setPhases(phases.map(p =>
      p.id === phaseId
        ? {
            ...p,
            features: p.features.map((f, idx) =>
              idx === featureIndex ? { ...f, items: [...f.items, ''] } : f
            ),
          }
        : p
    ));
  };

  const onFormSubmit = (data: any) => {
    onSubmit({
      client: {
        name: data.clientName,
        address: data.clientAddress,
        phone: data.clientPhone,
        email: data.clientEmail,
      },
      project: {
        name: data.projectName,
        preparedOn: data.preparedOn,
        overview: data.overview,
        features: features.filter(f => f.trim()),
      },
      phases,
      pricing: {
        totalPrice: data.totalPrice,
        currency: data.currency,
        includes: includes.filter(i => i.trim()),
        addOns,
      },
      payment: {
        model: 'weekly',
        schedule: paymentSchedule,
        terms: paymentTerms.filter(t => t.trim()),
      },
      clientResponsibilities: clientResponsibilities.filter(r => r.trim()),
      assumptions: assumptions.filter(a => a.trim()),
      validity: data.validity,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="terms">Terms</TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input id="clientName" {...register('clientName')} />
                  {errors.clientName && (
                    <p className="text-sm text-destructive">{errors.clientName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input id="clientEmail" type="email" {...register('clientEmail')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Client Phone</Label>
                  <Input id="clientPhone" {...register('clientPhone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Client Address</Label>
                  <Textarea id="clientAddress" {...register('clientAddress')} rows={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input id="projectName" {...register('projectName')} />
                  {errors.projectName && (
                    <p className="text-sm text-destructive">{errors.projectName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preparedOn">Prepared On *</Label>
                  <Input id="preparedOn" type="date" {...register('preparedOn')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="overview">Project Overview *</Label>
                <Textarea id="overview" {...register('overview')} rows={4} />
                {errors.overview && (
                  <p className="text-sm text-destructive">{errors.overview.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Key Features</Label>
                {features.map((feature, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input
                      value={feature}
                      onChange={(e) => {
                        const updated = [...features];
                        updated[idx] = e.target.value;
                        setFeatures(updated);
                      }}
                      placeholder="Feature description"
                    />
                    {features.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setFeatures([...features, ''])}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phases - This will be a large section, showing first phase as example */}
        <TabsContent value="phases" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Project Phases</CardTitle>
                <Button type="button" onClick={addPhase} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Phase
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {phases.map((phase, phaseIdx) => (
                <Card key={phase.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Phase {phase.number}</CardTitle>
                      {phases.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePhase(phase.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phase Name</Label>
                        <Input
                          value={phase.name}
                          onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                          placeholder="e.g., Foundation & Infrastructure"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input
                          value={phase.duration}
                          onChange={(e) => updatePhase(phase.id, { duration: e.target.value })}
                          placeholder="e.g., Days 1-3"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={phase.description}
                        onChange={(e) => updatePhase(phase.id, { description: e.target.value })}
                        rows={3}
                        placeholder="Phase description..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date Range</Label>
                      <Input
                        value={phase.dateRange}
                        onChange={(e) => updatePhase(phase.id, { dateRange: e.target.value })}
                        placeholder="e.g., Jan 20 - Jan 22"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Deliverables</Label>
                      {phase.deliverables.map((deliverable) => (
                        <div key={deliverable.id} className="flex gap-2 mb-2">
                          <Input
                            value={deliverable.description}
                            onChange={(e) => {
                              const updated = phase.deliverables.map(d =>
                                d.id === deliverable.id ? { ...d, description: e.target.value } : d
                              );
                              updatePhase(phase.id, { deliverables: updated });
                            }}
                            placeholder="Deliverable description"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDeliverable(phase.id, deliverable.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addDeliverable(phase.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Deliverable
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Features</Label>
                      {phase.features.map((feature, featIdx) => (
                        <div key={featIdx} className="border p-3 rounded space-y-2 mb-2">
                          <Input
                            value={feature.category}
                            onChange={(e) => {
                              const updated = phase.features.map((f, idx) =>
                                idx === featIdx ? { ...f, category: e.target.value } : f
                              );
                              updatePhase(phase.id, { features: updated });
                            }}
                            placeholder="Feature category"
                          />
                          {feature.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex gap-2">
                              <Input
                                value={item}
                                onChange={(e) => {
                                  const updated = phase.features.map((f, idx) =>
                                    idx === featIdx
                                      ? {
                                          ...f,
                                          items: f.items.map((it, itIdx) =>
                                            itIdx === itemIdx ? e.target.value : it
                                          ),
                                        }
                                      : f
                                  );
                                  updatePhase(phase.id, { features: updated });
                                }}
                                placeholder="Feature item"
                              />
                              {feature.items.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const updated = phase.features.map((f, idx) =>
                                      idx === featIdx
                                        ? { ...f, items: f.items.filter((_, i) => i !== itemIdx) }
                                        : f
                                    );
                                    updatePhase(phase.id, { features: updated });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addFeatureItem(phase.id, featIdx)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addFeature(phase.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Feature Category
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing */}
        <TabsContent value="pricing" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalPrice">Total Price *</Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    {...register('totalPrice', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <Select
                    value={watch('currency')}
                    onValueChange={(value) => setValue('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>What's Included</Label>
                {includes.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input
                      value={item}
                      onChange={(e) => {
                        const updated = [...includes];
                        updated[idx] = e.target.value;
                        setIncludes(updated);
                      }}
                      placeholder="Included item"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setIncludes(includes.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setIncludes([...includes, ''])}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Included Item
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Optional Add-ons</Label>
                {addOns.map((addOn) => (
                  <Card key={addOn.id} className="p-3">
                    <div className="space-y-2">
                      <Input
                        value={addOn.name}
                        onChange={(e) => {
                          setAddOns(addOns.map(a => a.id === addOn.id ? { ...a, name: e.target.value } : a));
                        }}
                        placeholder="Add-on name"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={addOn.price}
                          onChange={(e) => {
                            setAddOns(addOns.map(a =>
                              a.id === addOn.id ? { ...a, price: parseFloat(e.target.value) || 0 } : a
                            ));
                          }}
                          placeholder="Price"
                        />
                        <Input
                          value={addOn.description}
                          onChange={(e) => {
                            setAddOns(addOns.map(a => a.id === addOn.id ? { ...a, description: e.target.value } : a));
                          }}
                          placeholder="Description"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setAddOns(addOns.filter(a => a.id !== addOn.id))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddOns([...addOns, { id: Date.now().toString(), name: '', price: 0, description: '' }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Optional Add-on
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Terms */}
        <TabsContent value="payment" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Schedule</Label>
                {paymentSchedule.map((item) => (
                  <div key={item.id} className="grid grid-cols-3 gap-2 mb-2">
                    <Input
                      value={item.week}
                      onChange={(e) => {
                        setPaymentSchedule(paymentSchedule.map(i =>
                          i.id === item.id ? { ...i, week: e.target.value } : i
                        ));
                      }}
                      placeholder="Week"
                    />
                    <Input
                      value={item.coverage}
                      onChange={(e) => {
                        setPaymentSchedule(paymentSchedule.map(i =>
                          i.id === item.id ? { ...i, coverage: e.target.value } : i
                        ));
                      }}
                      placeholder="Coverage"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) => {
                          setPaymentSchedule(paymentSchedule.map(i =>
                            i.id === item.id ? { ...i, amount: parseFloat(e.target.value) || 0 } : i
                          ));
                        }}
                        placeholder="Amount"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPaymentSchedule(paymentSchedule.filter(i => i.id !== item.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentSchedule([...paymentSchedule, { id: Date.now().toString(), week: '', coverage: '', amount: 0 }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Schedule Item
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Payment Terms & Conditions</Label>
                {paymentTerms.map((term, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Textarea
                      value={term}
                      onChange={(e) => {
                        const updated = [...paymentTerms];
                        updated[idx] = e.target.value;
                        setPaymentTerms(updated);
                      }}
                      rows={2}
                      placeholder="Payment term"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setPaymentTerms(paymentTerms.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setPaymentTerms([...paymentTerms, ''])}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Term
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terms & Conditions */}
        <TabsContent value="terms" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Client Responsibilities</Label>
                {clientResponsibilities.map((resp, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Textarea
                      value={resp}
                      onChange={(e) => {
                        const updated = [...clientResponsibilities];
                        updated[idx] = e.target.value;
                        setClientResponsibilities(updated);
                      }}
                      rows={2}
                      placeholder="Client responsibility"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setClientResponsibilities(clientResponsibilities.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setClientResponsibilities([...clientResponsibilities, ''])}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Responsibility
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Assumptions</Label>
                {assumptions.map((assumption, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Textarea
                      value={assumption}
                      onChange={(e) => {
                        const updated = [...assumptions];
                        updated[idx] = e.target.value;
                        setAssumptions(updated);
                      }}
                      rows={2}
                      placeholder="Assumption"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setAssumptions(assumptions.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setAssumptions([...assumptions, ''])}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assumption
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="validity">Validity Period</Label>
                <Input id="validity" {...register('validity')} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-6">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Quotation'}
        </Button>
      </div>
    </form>
  );
}
