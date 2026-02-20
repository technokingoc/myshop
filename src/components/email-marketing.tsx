"use client";

import { useState, useEffect } from "react";
import { Mail, Users, Send, Calendar, Eye, Edit3, Trash2, Plus } from "lucide-react";
import { useLanguage } from "@/lib/language";

interface EmailCampaign {
  id: number;
  name: string;
  subject: string;
  content: string;
  audienceType: 'all' | 'customers' | 'subscribers';
  status: 'draft' | 'scheduled' | 'sent';
  scheduledAt?: string;
  sentAt?: string;
  estimatedRecipients: number;
  createdAt: string;
}

interface EmailMarketingProps {
  storeSlug: string;
  storeName: string;
}

const dict = {
  en: {
    title: "Email Marketing",
    subtitle: "Create and manage email campaigns for your customers",
    createCampaign: "Create Campaign",
    noCampaigns: "No campaigns yet",
    createFirst: "Create your first email campaign to engage with customers",
    campaignName: "Campaign Name",
    emailSubject: "Email Subject",
    emailContent: "Email Content",
    audience: "Audience",
    audienceAll: "All Visitors",
    audienceCustomers: "Customers Only",
    audienceSubscribers: "Newsletter Subscribers",
    schedule: "Schedule",
    sendNow: "Send Now",
    scheduleFor: "Schedule for Later",
    saveDraft: "Save as Draft",
    estimatedReach: "Estimated Reach",
    recipients: "recipients",
    status: "Status",
    draft: "Draft",
    scheduled: "Scheduled",
    sent: "Sent",
    created: "Created",
    scheduledFor: "Scheduled for",
    sentOn: "Sent on",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    cancel: "Cancel",
    save: "Save",
    loading: "Loading...",
    campaigns: "Campaigns",
    newCampaign: "New Campaign",
    contentPlaceholder: "Write your email content here...\n\nYou can use these placeholders:\n- {{customer_name}} - Customer's name\n- {{store_name}} - Your store name\n- {{unsubscribe_link}} - Unsubscribe link",
    subjectPlaceholder: "Enter email subject line",
    namePlaceholder: "e.g., Summer Sale Campaign",
    previewNote: "This is a UI preview only. No actual emails will be sent.",
    deleteConfirm: "Are you sure you want to delete this campaign?",
  },
  pt: {
    title: "Marketing por Email",
    subtitle: "Crie e gira campanhas de email para os seus clientes",
    createCampaign: "Criar Campanha",
    noCampaigns: "Ainda não tem campanhas",
    createFirst: "Crie a sua primeira campanha de email para interagir com clientes",
    campaignName: "Nome da Campanha",
    emailSubject: "Assunto do Email",
    emailContent: "Conteúdo do Email",
    audience: "Audiência",
    audienceAll: "Todos os Visitantes",
    audienceCustomers: "Apenas Clientes",
    audienceSubscribers: "Subscritores da Newsletter",
    schedule: "Agendar",
    sendNow: "Enviar Agora",
    scheduleFor: "Agendar para Mais Tarde",
    saveDraft: "Guardar como Rascunho",
    estimatedReach: "Alcance Estimado",
    recipients: "destinatários",
    status: "Estado",
    draft: "Rascunho",
    scheduled: "Agendado",
    sent: "Enviado",
    created: "Criado",
    scheduledFor: "Agendado para",
    sentOn: "Enviado em",
    edit: "Editar",
    delete: "Eliminar",
    view: "Ver",
    cancel: "Cancelar",
    save: "Guardar",
    loading: "Carregando...",
    campaigns: "Campanhas",
    newCampaign: "Nova Campanha",
    contentPlaceholder: "Escreva o conteúdo do seu email aqui...\n\nPode usar estes marcadores:\n- {{customer_name}} - Nome do cliente\n- {{store_name}} - Nome da sua loja\n- {{unsubscribe_link}} - Link de cancelamento",
    subjectPlaceholder: "Digite o assunto do email",
    namePlaceholder: "ex: Campanha de Saldos de Verão",
    previewNote: "Esta é apenas uma prévia da interface. Nenhum email será realmente enviado.",
    deleteConfirm: "Tem certeza que quer eliminar esta campanha?",
  },
};

export default function EmailMarketing({ storeSlug, storeName }: EmailMarketingProps) {
  const { lang } = useLanguage();
  const t = dict[lang];
  
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  
  // Form states
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formAudience, setFormAudience] = useState<'all' | 'customers' | 'subscribers'>('all');
  const [formScheduleType, setFormScheduleType] = useState<'now' | 'later' | 'draft'>('draft');
  const [formScheduleDate, setFormScheduleDate] = useState("");

  useEffect(() => {
    loadCampaigns();
  }, [storeSlug]);

  const loadCampaigns = async () => {
    try {
      // Mock data for now since tables don't exist yet
      const mockCampaigns: EmailCampaign[] = [
        {
          id: 1,
          name: "Welcome Series",
          subject: "Welcome to " + storeName + "!",
          content: "Thank you for visiting our store. Here are some products you might like...",
          audienceType: 'all',
          status: 'sent',
          sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedRecipients: 245,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          name: "Summer Sale",
          subject: "🌞 Summer Sale - Up to 50% Off!",
          content: "Don't miss our biggest sale of the year. Limited time offers on all categories.",
          audienceType: 'customers',
          status: 'scheduled',
          scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedRecipients: 128,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 3,
          name: "Product Recommendations",
          subject: "New products just for you",
          content: "Based on your browsing history, here are some products we think you'll love.",
          audienceType: 'subscribers',
          status: 'draft',
          estimatedRecipients: 89,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedRecipients = (audienceType: string) => {
    // Mock estimates
    const estimates = {
      all: 350,
      customers: 150,
      subscribers: 95,
    };
    return estimates[audienceType as keyof typeof estimates] || 0;
  };

  const resetForm = () => {
    setFormName("");
    setFormSubject("");
    setFormContent("");
    setFormAudience('all');
    setFormScheduleType('draft');
    setFormScheduleDate("");
    setEditingCampaign(null);
  };

  const handleSaveCampaign = async () => {
    const campaignData: Partial<EmailCampaign> = {
      name: formName,
      subject: formSubject,
      content: formContent,
      audienceType: formAudience,
      status: formScheduleType === 'draft' ? 'draft' : 
              formScheduleType === 'now' ? 'sent' : 'scheduled',
      scheduledAt: formScheduleType === 'later' ? formScheduleDate : undefined,
      sentAt: formScheduleType === 'now' ? new Date().toISOString() : undefined,
      estimatedRecipients: getEstimatedRecipients(formAudience),
    };

    if (editingCampaign) {
      // Update existing campaign
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === editingCampaign.id 
          ? { ...campaign, ...campaignData }
          : campaign
      ));
    } else {
      // Create new campaign
      const newCampaign: EmailCampaign = {
        ...campaignData as EmailCampaign,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      setCampaigns(prev => [newCampaign, ...prev]);
    }

    resetForm();
    setShowCreateForm(false);
  };

  const handleEditCampaign = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setFormName(campaign.name);
    setFormSubject(campaign.subject);
    setFormContent(campaign.content);
    setFormAudience(campaign.audienceType);
    setFormScheduleType(campaign.status === 'draft' ? 'draft' : 
                      campaign.status === 'scheduled' ? 'later' : 'now');
    setFormScheduleDate(campaign.scheduledAt ? 
      new Date(campaign.scheduledAt).toISOString().slice(0, 16) : "");
    setShowCreateForm(true);
  };

  const handleDeleteCampaign = (campaignId: number) => {
    if (confirm(t.deleteConfirm)) {
      setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
    }
  };

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-US');

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-600',
      scheduled: 'bg-blue-100 text-blue-700',
      sent: 'bg-green-100 text-green-700',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getAudienceLabel = (audienceType: string) => {
    const labels = {
      all: t.audienceAll,
      customers: t.audienceCustomers,
      subscribers: t.audienceSubscribers,
    };
    return labels[audienceType as keyof typeof labels] || t.audienceAll;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="text-center">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t.title}</h2>
            <p className="text-slate-600 mt-1">{t.subtitle}</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateForm(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t.createCampaign}
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">{t.previewNote}</p>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingCampaign ? `${t.edit} ${t.campaigns}` : t.newCampaign}
          </h3>
          
          <div className="space-y-4">
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.campaignName}
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t.namePlaceholder}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Email Subject */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.emailSubject}
              </label>
              <input
                type="text"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder={t.subjectPlaceholder}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Email Content */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.emailContent}
              </label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder={t.contentPlaceholder}
                rows={8}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Audience */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.audience}
              </label>
              <select
                value={formAudience}
                onChange={(e) => setFormAudience(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">{t.audienceAll}</option>
                <option value="customers">{t.audienceCustomers}</option>
                <option value="subscribers">{t.audienceSubscribers}</option>
              </select>
              <p className="text-sm text-slate-500 mt-1">
                {t.estimatedReach}: {getEstimatedRecipients(formAudience)} {t.recipients}
              </p>
            </div>

            {/* Schedule Options */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.schedule}
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scheduleType"
                    value="draft"
                    checked={formScheduleType === 'draft'}
                    onChange={(e) => setFormScheduleType(e.target.value as any)}
                    className="mr-2"
                  />
                  {t.saveDraft}
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scheduleType"
                    value="now"
                    checked={formScheduleType === 'now'}
                    onChange={(e) => setFormScheduleType(e.target.value as any)}
                    className="mr-2"
                  />
                  {t.sendNow} <span className="text-sm text-slate-500 ml-2">(Preview only)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scheduleType"
                    value="later"
                    checked={formScheduleType === 'later'}
                    onChange={(e) => setFormScheduleType(e.target.value as any)}
                    className="mr-2"
                  />
                  {t.scheduleFor}
                </label>
                {formScheduleType === 'later' && (
                  <input
                    type="datetime-local"
                    value={formScheduleDate}
                    onChange={(e) => setFormScheduleDate(e.target.value)}
                    className="mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveCampaign}
                disabled={!formName || !formSubject || !formContent}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.save}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateForm(false);
                }}
                className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{t.campaigns}</h3>
        
        {campaigns.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-slate-900 font-semibold mb-2">{t.noCampaigns}</h4>
            <p className="text-slate-600 text-sm">{t.createFirst}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-slate-900">{campaign.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {t[campaign.status as keyof typeof t] || campaign.status}
                      </span>
                    </div>
                    <p className="text-slate-700 mb-2">{campaign.subject}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {getAudienceLabel(campaign.audienceType)} ({campaign.estimatedRecipients} {t.recipients})
                      </span>
                      <span>
                        {t.created}: {formatDate(campaign.createdAt)}
                      </span>
                      {campaign.scheduledAt && (
                        <span>
                          {t.scheduledFor}: {formatDate(campaign.scheduledAt)}
                        </span>
                      )}
                      {campaign.sentAt && (
                        <span>
                          {t.sentOn}: {formatDate(campaign.sentAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditCampaign(campaign)}
                      className="p-2 text-slate-600 hover:text-slate-900"
                      title={t.edit}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="p-2 text-red-600 hover:text-red-800"
                      title={t.delete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}