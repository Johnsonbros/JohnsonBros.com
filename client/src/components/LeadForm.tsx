import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Validation schema based on HousecallPro LeadCreate API
const leadFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  address: z.string().min(3, "Address is required"),
  serviceDetails: z.string().min(3, "Please describe what's going on"),
  isEmergency: z.boolean().optional(),
  smsConsent: z.literal(true, { errorMap: () => ({ message: "You must agree to receive texts" }) }),
  website: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
  onSuccess?: () => void;
  leadSource?: string;
  className?: string;
}

export default function LeadForm({ onSuccess, leadSource = "Website Contact Form", className }: LeadFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      serviceDetails: "",
      isEmergency: false,
      smsConsent: undefined as unknown as true,
      website: "",
    },
  });

  // Lead creation mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      if (data.website) {
        return { ok: true };
      }
      return apiRequest("POST", "/api/v1/leads", {
        customer: {
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email || undefined,
          mobile_number: data.phone,
          address: data.address,
          notifications_enabled: true,
          sms_consent: data.smsConsent,
          is_emergency: data.isEmergency || false,
          lead_source: leadSource,
          notes: data.serviceDetails,
          tags: ["Website Lead"],
        },
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Thank you!",
        description: "We've received your request and will contact you soon.",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LeadFormData) => {
    createLeadMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
            <p className="text-gray-600 mb-4">
              We've received your request and will call you back shortly to schedule your service.
            </p>
            <Button 
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="w-full"
              data-testid="button-submit-another"
            >
              Submit Another Request
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2" data-testid="text-contact-title">
            Contact us
          </h2>
          <p className="text-sm text-gray-600" data-testid="text-contact-subtitle">
            Leave your contact details and we will call you back.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              {...form.register("firstName")}
              placeholder="First name"
              className="w-full"
              data-testid="input-first-name"
            />
            {form.formState.errors.firstName && (
              <p className="text-red-500 text-xs mt-1" data-testid="error-first-name">
                {form.formState.errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <Input
              {...form.register("lastName")}
              placeholder="Last name"
              className="w-full"
              data-testid="input-last-name"
            />
            {form.formState.errors.lastName && (
              <p className="text-red-500 text-xs mt-1" data-testid="error-last-name">
                {form.formState.errors.lastName.message}
              </p>
            )}
          </div>

          <div>
            <Input
              {...form.register("phone")}
              type="tel"
              placeholder="Phone number"
              className="w-full"
              data-testid="input-phone"
            />
            {form.formState.errors.phone && (
              <p className="text-red-500 text-xs mt-1" data-testid="error-phone">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <Input
              {...form.register("email")}
              type="email"
              placeholder="Email (optional)"
              className="w-full"
              data-testid="input-email"
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-xs mt-1" data-testid="error-email">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Input
              {...form.register("address")}
              placeholder="Address"
              className="w-full"
              data-testid="input-address"
            />
            {form.formState.errors.address && (
              <p className="text-red-500 text-xs mt-1" data-testid="error-address">
                {form.formState.errors.address.message}
              </p>
            )}
          </div>

          <div>
            <Textarea
              {...form.register("serviceDetails")}
              placeholder="What's going on?"
              className="w-full min-h-[80px] resize-none"
              data-testid="input-service-details"
            />
            {form.formState.errors.serviceDetails && (
              <p className="text-red-500 text-xs mt-1" data-testid="error-service-details">
                {form.formState.errors.serviceDetails.message}
              </p>
            )}
          </div>

          <input
            {...form.register("website")}
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="flex items-start space-x-2 rounded-lg border border-red-100 bg-red-50/70 p-3">
            <Checkbox
              id="emergency-flag"
              className="mt-1"
              checked={form.watch("isEmergency") === true}
              onCheckedChange={(checked) => form.setValue("isEmergency", checked === true)}
              data-testid="checkbox-emergency-flag"
            />
            <label
              htmlFor="emergency-flag"
              className="text-xs text-red-700 leading-relaxed cursor-pointer"
              data-testid="label-emergency-flag"
            >
              This is an emergency — please route my request to the on-call team right away.
            </label>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="sms-consent"
              className="mt-1"
              checked={form.watch("smsConsent") === true}
              onCheckedChange={(checked) => form.setValue("smsConsent", checked === true ? true : undefined as unknown as true)}
              data-testid="checkbox-sms-consent"
            />
            <label 
              htmlFor="sms-consent" 
              className="text-xs text-gray-600 leading-relaxed cursor-pointer"
              data-testid="label-sms-consent"
            >
              I agree to receive text messages about my request. Message and data rates may apply. Reply HELP for help and STOP to stop. <span className="text-red-500">*</span>
            </label>
          </div>
          {form.formState.errors.smsConsent && (
            <p className="text-red-500 text-xs -mt-2" data-testid="error-sms-consent">
              {form.formState.errors.smsConsent.message}
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            disabled={createLeadMutation.isPending}
            data-testid="button-contact-submit"
          >
            {createLeadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Contact us'
            )}
          </Button>
        </form>

        <div className="mt-4 text-center border-t border-gray-100 pt-4">
          <p className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase" data-testid="text-powered-by">
            Johnson Bros. Plumbing & Drain Cleaning
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
