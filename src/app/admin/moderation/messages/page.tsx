"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language";
import { 
  AlertTriangle, 
  Flag, 
  MessageCircle, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  Filter,
  Search,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
const toast = { error: (msg: string) => console.error(msg), success: (msg: string) => console.log(msg) };

interface ModerationData {
  reports: any[];
  flags: any[];
  statistics: {
    pendingReports: number;
    pendingFlags: number;
    totalReports: number;
    totalFlags: number;
  };
}

export default function AdminModerationMessagesPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<ModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("reports");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  
  // Moderation action state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [moderationAction, setModerationAction] = useState("");
  const [moderationNotes, setModerationNotes] = useState("");
  const [takingAction, setTakingAction] = useState(false);

  const fetchModerationData = async () => {
    try {
      const params = new URLSearchParams({
        type: activeTab === "flags" ? "flags" : "reports",
        status: selectedStatus,
      });

      if (selectedSeverity !== "all") {
        params.append("severity", selectedSeverity);
      }

      const response = await fetch(`/api/admin/moderation/messages?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        throw new Error("Failed to fetch moderation data");
      }
    } catch (error) {
      console.error("Error fetching moderation data:", error);
      toast.error("Failed to load moderation data");
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchModerationData();
    setRefreshing(false);
  };

  const handleModerationAction = async () => {
    if (!selectedItem || !moderationAction) return;

    setTakingAction(true);
    try {
      const response = await fetch("/api/admin/moderation/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab === "flags" ? "flag" : "report",
          id: selectedItem.id,
          action: moderationAction,
          notes: moderationNotes,
        }),
      });

      if (response.ok) {
        toast.success("Moderation action applied successfully");
        setActionModalOpen(false);
        setSelectedItem(null);
        setModerationAction("");
        setModerationNotes("");
        await refreshData();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to apply moderation action");
      }
    } catch (error) {
      console.error("Error applying moderation action:", error);
      toast.error(error instanceof Error ? error.message : "Failed to apply moderation action");
    } finally {
      setTakingAction(false);
    }
  };

  const openActionModal = (item: any) => {
    setSelectedItem(item);
    setModerationAction("");
    setModerationNotes("");
    setActionModalOpen(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "resolved":
        return "bg-green-500";
      case "dismissed":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchModerationData().finally(() => setLoading(false));
  }, [activeTab, selectedStatus, selectedSeverity]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Message Moderation</h1>
          <p className="text-gray-600 mt-1">Review reported messages and flagged conversations</p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={refreshing}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.statistics.pendingReports}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Flags</CardTitle>
              <Flag className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.statistics.pendingFlags}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <MessageCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.statistics.totalReports}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
              <Flag className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.statistics.totalFlags}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Moderation Items */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="reports">Message Reports</TabsTrigger>
          <TabsTrigger value="flags">Conversation Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {data?.reports.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No message reports found</p>
              </CardContent>
            </Card>
          ) : (
            data?.reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${getStatusColor(report.status)} text-white`}>
                          {report.status}
                        </Badge>
                        <Badge variant="outline">{report.reason}</Badge>
                        <Badge variant="outline">{report.category}</Badge>
                        <span className="text-sm text-gray-500">
                          by {report.reporterName} • {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{report.description}</p>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Reported Message:</p>
                        <p className="text-sm">{report.messageContent}</p>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Store: {report.storeName} • Message sent: {new Date(report.messageCreatedAt).toLocaleString()}
                      </div>
                    </div>
                    <Button 
                      onClick={() => openActionModal(report)}
                      disabled={report.status !== "pending"}
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="flags" className="space-y-4">
          {data?.flags.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Flag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No conversation flags found</p>
              </CardContent>
            </Card>
          ) : (
            data?.flags.map((flag) => (
              <Card key={flag.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${getStatusColor(flag.status)} text-white`}>
                          {flag.status}
                        </Badge>
                        <Badge className={`${getSeverityColor(flag.severity)} text-white`}>
                          {flag.severity}
                        </Badge>
                        <Badge variant="outline">{flag.reason}</Badge>
                        {flag.autoFlagged && <Badge variant="outline">Auto-flagged</Badge>}
                        <span className="text-sm text-gray-500">
                          {flag.flaggerName ? `by ${flag.flaggerName}` : "Auto-detected"} • {new Date(flag.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{flag.description}</p>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Conversation:</p>
                        <p className="text-sm">{flag.conversationSubject || "No subject"}</p>
                        <p className="text-xs text-gray-600 mt-1">{flag.lastMessagePreview}</p>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Store: {flag.storeName}
                      </div>
                    </div>
                    <Button 
                      onClick={() => openActionModal(flag)}
                      disabled={flag.status !== "pending"}
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Moderation Action Dialog */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Take Moderation Action</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Action</label>
              <Select value={moderationAction} onValueChange={setModerationAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dismiss">Dismiss</SelectItem>
                  <SelectItem value="approve">Approve (Close conversation)</SelectItem>
                  <SelectItem value="warn">Warn User</SelectItem>
                  <SelectItem value="temp_ban">Temporary Ban</SelectItem>
                  <SelectItem value="permanent_ban">Permanent Ban</SelectItem>
                  <SelectItem value="delete_message">Delete Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-2">Notes</label>
              <Textarea
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                placeholder="Add moderation notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionModalOpen(false)}
              disabled={takingAction}
            >
              Cancel
            </Button>
            <Button
              onClick={handleModerationAction}
              disabled={!moderationAction || takingAction}
            >
              {takingAction ? "Applying..." : "Apply Action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}