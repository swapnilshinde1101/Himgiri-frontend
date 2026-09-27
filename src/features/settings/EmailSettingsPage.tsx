import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  Mail, Server, Send, Lock, Eye, EyeOff, CheckCircle2, 
  AlertCircle, ShieldCheck, Zap, HelpCircle, Save, Check 
} from 'lucide-react';
import { emailSettingsService, EmailSettingsDto } from '../../services/emailSettingsService';

interface PresetProvider {
  name: string;
  host: string;
  port: number;
  ssl: boolean;
  tip: string;
  recommendedSender?: string;
}

const PROVIDER_PRESETS: PresetProvider[] = [
  {
    name: 'Gmail (App Password)',
    host: 'smtp.gmail.com',
    port: 587,
    ssl: true,
    tip: 'Requires 2FA enabled on Google and a 16-character Google App Password (not standard account password).'
  },
  {
    name: 'Brevo (Sendinblue)',
    host: 'smtp-relay.brevo.com',
    port: 587,
    ssl: true,
    tip: 'Create an SMTP key in Brevo under SMTP & API. Use your registered login email as Sender Email.'
  },
  {
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    ssl: true,
    tip: 'Sender Email must match a verified Single Sender or Domain in your Twilio SendGrid account.'
  },
  {
    name: 'Amazon SES',
    host: 'email-smtp.ap-south-1.amazonaws.com',
    port: 587,
    ssl: true,
    tip: 'AWS Mumbai region shown. Verify domain identity in Amazon SES before sending live production emails.'
  },
  {
    name: 'Custom SMTP',
    host: '',
    port: 587,
    ssl: true,
    tip: 'Configure any private or standard SMTP relay server (e.g. cPanel, Zoho, Microsoft 365).'
  }
];

export default function EmailSettingsPage(): JSX.Element {
  const queryClient = useQueryClient();

  // Form state
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [enableSsl, setEnableSsl] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('Custom SMTP');
  const [testRecipient, setTestRecipient] = useState('');
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Query settings
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['emailSettings'],
    queryFn: () => emailSettingsService.getSettings(),
  });

  const settings: EmailSettingsDto | undefined = response?.data;

  // Initialize form with fetched data
  useEffect(() => {
    if (settings) {
      setSmtpHost(settings.smtpHost || '');
      setSmtpPort(settings.smtpPort || 587);
      setSenderEmail(settings.senderEmail || '');
      setSenderName(settings.senderName || 'Himgiri Goods & Uniforms');
      setEnableSsl(settings.enableSsl);
      setIsConfigured(settings.isConfigured);

      // Match preset
      const matched = PROVIDER_PRESETS.find(p => p.host.toLowerCase() === (settings.smtpHost || '').toLowerCase());
      if (matched) {
        setSelectedPreset(matched.name);
      } else {
        setSelectedPreset('Custom SMTP');
      }

      if (settings.hasPassword) {
        setSmtpPassword('••••••••');
      }
    }
  }, [settings]);

  // Handle Preset selection
  const handleSelectPreset = (preset: PresetProvider) => {
    setSelectedPreset(preset.name);
    if (preset.host) {
      setSmtpHost(preset.host);
      setSmtpPort(preset.port);
      setEnableSsl(preset.ssl);
    }
  };

  // Mutation for saving
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort),
        senderEmail: senderEmail.trim(),
        senderName: senderName.trim(),
        smtpPassword: smtpPassword.includes('•••') ? undefined : smtpPassword,
        enableSsl,
        isConfigured,
      };
      return emailSettingsService.updateSettings(payload);
    },
    onSuccess: (res) => {
      if (res.statusCode === 200) {
        toast.success('Email settings saved successfully!');
        queryClient.invalidateQueries({ queryKey: ['emailSettings'] });
      } else {
        toast.error(res.message || 'Failed to save settings.');
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error saving email configuration.');
    }
  });

  // Mutation for test connection
  const testMutation = useMutation({
    mutationFn: async () => {
      if (!testRecipient.trim()) {
        throw new Error('Please enter a recipient email address for testing.');
      }
      return emailSettingsService.testConnection({
        toEmail: testRecipient.trim(),
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort),
        senderEmail: senderEmail.trim(),
        senderName: senderName.trim(),
        smtpPassword: smtpPassword.includes('•••') ? undefined : smtpPassword,
        enableSsl,
      });
    },
    onSuccess: (res) => {
      setTestStatus({ success: true, message: res.message || 'Test email sent successfully!' });
      toast.success('Test email delivered!');
    },
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to send test email.';
      setTestStatus({ success: false, message: errorMsg });
      toast.error('Test connection failed.');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
        Failed to load email configurations. Please verify backend connectivity.
      </div>
    );
  }

  const currentPresetInfo = PROVIDER_PRESETS.find(p => p.name === selectedPreset);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Mail className="h-6 w-6 text-indigo-600" />
            Email & SMTP Settings
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Configure SMTP mail server credentials for transactional emails, invoice PDFs, and dispatch notifications.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {settings?.isConfigured && settings?.hasPassword ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Live Delivery Active
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Simulated Mode (No Credentials)
            </div>
          )}
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3">
        <Zap className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900 space-y-1">
          <p className="font-medium">Automatic Transactional Notifications</p>
          <p className="text-blue-800/80 text-xs leading-relaxed">
            When configured, customers automatically receive an <strong>Order Confirmation email with an official GST Tax Invoice PDF</strong> upon payment approval, and a <strong>Dispatch email with Delivery Challan PDF</strong> when orders ship.
          </p>
        </div>
      </div>

      {/* Provider Quick Presets */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
          Quick Setup Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {PROVIDER_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.name;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600/30'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Server className={`h-4 w-4 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                  {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 stroke-[3]" />}
                </div>
                <div className="text-xs font-semibold text-gray-900 leading-snug">{preset.name}</div>
              </button>
            );
          })}
        </div>
        {currentPresetInfo?.tip && (
          <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            <HelpCircle className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span>{currentPresetInfo.tip}</span>
          </p>
        )}
      </div>

      {/* Configuration Form Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <h3 className="text-base font-bold text-gray-900 border-b pb-3">Server & Sender Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* SMTP Host */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              SMTP Host Server <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp.example.com"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* SMTP Port */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              SMTP Port <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={smtpPort}
              onChange={(e) => setSmtpPort(Number(e.target.value))}
              placeholder="587"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Sender Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Sender Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="noreply@himgirigoods.com"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Sender Display Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Sender Display Name
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Himgiri Goods & Uniforms"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* SMTP Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-700">
                SMTP Password / App Key
              </label>
              {settings?.hasPassword && !smtpPassword.includes('•••') && (
                <span className="text-[11px] text-emerald-600 font-medium">New password will overwrite</span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                onFocus={() => {
                  if (smtpPassword === '••••••••') setSmtpPassword('');
                }}
                placeholder={settings?.hasPassword ? '••••••••' : 'Enter SMTP password'}
                className="w-full pl-3.5 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Toggles & Options */}
        <div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50/50">
            <input
              type="checkbox"
              checked={enableSsl}
              onChange={(e) => setEnableSsl(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <div>
              <div className="text-xs font-semibold text-gray-900">Enable SSL / TLS Encryption</div>
              <div className="text-[11px] text-gray-500">Secure connection over STARTTLS (standard for port 587/465).</div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50/50">
            <input
              type="checkbox"
              checked={isConfigured}
              onChange={(e) => setIsConfigured(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <div>
              <div className="text-xs font-semibold text-gray-900">Enable Live Email Dispatching</div>
              <div className="text-[11px] text-gray-500">When disabled, notifications are simulated in server logs.</div>
            </div>
          </label>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-3">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Email Configuration
              </>
            )}
          </button>
        </div>
      </div>

      {/* Diagnostic & Connection Testing Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-600" />
              Test SMTP Connection
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Send an instant real-time diagnostic test email to verify credentials and firewall accessibility.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="flex-1">
            <input
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="Enter your personal/admin email address"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending || !testRecipient}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
          >
            {testMutation.isPending ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending Test...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Test Email
              </>
            )}
          </button>
        </div>

        {/* Test Result Message */}
        {testStatus && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
              testStatus.success
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-red-50/80 border-red-200 text-red-900'
            }`}
          >
            {testStatus.success ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-semibold">
                {testStatus.success ? 'Connection Successful' : 'Delivery Test Failed'}
              </div>
              <div className="text-xs opacity-90 leading-relaxed font-mono">
                {testStatus.message}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
