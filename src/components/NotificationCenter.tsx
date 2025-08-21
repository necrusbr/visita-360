import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Clock, 
  AlertTriangle, 
  X,
  Settings,
  User,
  TrendingUp,
  Building2
} from 'lucide-react';
import { NotificationItem } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  stats: {
    total: number;
    unread: number;
    urgent: number;
    followUpsDue: number;
  };
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onNavigateToFollowUp?: () => void;
  onNavigateToDashboard?: () => void;
}

export default function NotificationCenter({
  notifications,
  stats,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onClearAll,
  onNavigateToFollowUp,
  onNavigateToDashboard
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'follow_up_due':
      case 'follow_up_overdue':
        return <Clock className="w-4 h-4" />;
      case 'meta_alert':
        return <TrendingUp className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: NotificationItem['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-gray-500 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const handleNotificationAction = (notification: NotificationItem) => {
    if (notification.actionCallback) {
      notification.actionCallback();
    } else if (notification.type === 'follow_up_due' || notification.type === 'follow_up_overdue') {
      onNavigateToFollowUp?.();
    } else if (notification.type === 'meta_alert') {
      onNavigateToDashboard?.();
    }
    
    setIsOpen(false);
    onMarkAsRead(notification.id);
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {stats.unread > 0 ? (
            <BellRing className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {stats.unread > 0 && (
            <Badge 
              variant={stats.urgent > 0 ? "destructive" : "default"} 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {stats.unread > 99 ? '99+' : stats.unread}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:w-[400px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificações
              </SheetTitle>
              <div className="flex gap-2">
                {stats.unread > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Marcar todas como lidas
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="text-xs text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center p-2 rounded-lg bg-brand-50">
                <div className="text-lg font-bold text-brand-600">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-orange-50">
                <div className="text-lg font-bold text-orange-600">{stats.followUpsDue}</div>
                <div className="text-xs text-muted-foreground">Follow-ups</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-red-50">
                <div className="text-lg font-bold text-red-600">{stats.urgent}</div>
                <div className="text-xs text-muted-foreground">Urgentes</div>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma notificação</p>
                  <p className="text-sm mt-1">Você está em dia com tudo!</p>
                </div>
              ) : (
                <>
                  {/* Notificações não lidas */}
                  {unreadNotifications.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <BellRing className="w-4 h-4" />
                        Não lidas ({unreadNotifications.length})
                      </h3>
                      <div className="space-y-2">
                        {unreadNotifications.map((notification) => (
                          <Card 
                            key={notification.id} 
                            className={`${getPriorityColor(notification.priority)} transition-colors cursor-pointer hover:shadow-md`}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-sm">
                                        {notification.title}
                                      </h4>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-2">
                                        {formatDistanceToNow(notification.createdAt, {
                                          addSuffix: true,
                                          locale: ptBR
                                        })}
                                      </p>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onMarkAsRead(notification.id);
                                        }}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Check className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDismiss(notification.id);
                                        }}
                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {notification.actionLabel && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleNotificationAction(notification)}
                                      className="mt-2 h-7"
                                    >
                                      {notification.actionLabel}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Separador */}
                  {unreadNotifications.length > 0 && readNotifications.length > 0 && (
                    <Separator className="my-4" />
                  )}

                  {/* Notificações lidas */}
                  {readNotifications.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2 text-muted-foreground flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Lidas ({readNotifications.length})
                      </h3>
                      <div className="space-y-2">
                        {readNotifications.slice(0, 10).map((notification) => (
                          <Card 
                            key={notification.id} 
                            className="opacity-60 border-dashed"
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5 opacity-50">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-sm">
                                        {notification.title}
                                      </h4>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-2">
                                        {formatDistanceToNow(notification.createdAt, {
                                          addSuffix: true,
                                          locale: ptBR
                                        })}
                                      </p>
                                    </div>
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDismiss(notification.id);
                                      }}
                                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        
                        {readNotifications.length > 10 && (
                          <p className="text-center text-sm text-muted-foreground py-2">
                            E mais {readNotifications.length - 10} notificações antigas...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}