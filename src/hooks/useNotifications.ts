import { useState, useEffect, useCallback } from 'react';
import { Visita, FollowUp } from '../types';

export interface NotificationItem {
  id: string;
  type: 'follow_up_due' | 'follow_up_overdue' | 'meta_alert' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  visitaId?: number;
  isRead: boolean;
  actionLabel?: string;
  actionCallback?: () => void;
}

interface UseNotificationsOptions {
  followUpPrazo: number; // dias
  enableBrowserNotifications?: boolean;
  enableSound?: boolean;
}

export function useNotifications(
  visitas: Visita[],
  followups: FollowUp[],
  options: UseNotificationsOptions
) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Solicitar permissão para notificações do browser
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }
    return false;
  }, []);

  // Verificar permissão atual
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Enviar notificação do browser
  const sendBrowserNotification = useCallback((notification: NotificationItem) => {
    if (!options.enableBrowserNotifications || permission !== 'granted') return;

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent',
      silent: !options.enableSound
    });

    browserNotification.onclick = () => {
      window.focus();
      if (notification.actionCallback) {
        notification.actionCallback();
      }
      browserNotification.close();
    };

    // Auto-close após 5 segundos (exceto urgentes)
    if (notification.priority !== 'urgent') {
      setTimeout(() => browserNotification.close(), 5000);
    }
  }, [options.enableBrowserNotifications, options.enableSound, permission]);

  // Gerar notificações de follow-up pendente
  const generateFollowUpNotifications = useCallback((): NotificationItem[] => {
    const now = new Date();
    const notifications: NotificationItem[] = [];

    visitas.forEach(visita => {
      // Encontrar último follow-up da visita
      const visitaFollowups = followups
        .filter(fu => fu.visitaId === visita.id)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      const ultimoFollowup = visitaFollowups[0];
      
      // Se já fechou pedido, não precisa de follow-up
      if (ultimoFollowup?.status === 'Fechou pedido') return;

      // Data base para calcular prazo (último follow-up ou data da visita)
      const dataBase = ultimoFollowup 
        ? new Date(ultimoFollowup.data)
        : new Date(visita.data);

      const diasPassados = Math.floor((now.getTime() - dataBase.getTime()) / (1000 * 60 * 60 * 24));
      
      // Notificação de follow-up devido (no prazo)
      if (diasPassados === options.followUpPrazo) {
        notifications.push({
          id: `follow_up_due_${visita.id}_${Date.now()}`,
          type: 'follow_up_due',
          title: 'Follow-up Necessário',
          message: `${visita.empresa} - Prazo de ${options.followUpPrazo} dias atingido`,
          priority: 'medium',
          createdAt: now,
          visitaId: visita.id,
          isRead: false,
          actionLabel: 'Fazer Follow-up'
        });
      }
      
      // Notificação de follow-up atrasado
      if (diasPassados > options.followUpPrazo) {
        const diasAtraso = diasPassados - options.followUpPrazo;
        notifications.push({
          id: `follow_up_overdue_${visita.id}_${Date.now()}`,
          type: 'follow_up_overdue',
          title: 'Follow-up Atrasado',
          message: `${visita.empresa} - ${diasAtraso} dias de atraso`,
          priority: diasAtraso > 7 ? 'urgent' : 'high',
          createdAt: now,
          visitaId: visita.id,
          isRead: false,
          actionLabel: 'Fazer Follow-up Urgente'
        });
      }
    });

    return notifications;
  }, [visitas, followups, options.followUpPrazo]);

  // Gerar notificações de meta
  const generateMetaNotifications = useCallback((): NotificationItem[] => {
    const notifications: NotificationItem[] = [];
    const now = new Date();
    const mesAtual = now.toISOString().slice(0, 7); // YYYY-MM
    
    // Visitas no mês atual
    const visitasMes = visitas.filter(v => v.data.startsWith(mesAtual));
    
    // Follow-ups fechados no mês
    const fechadosMes = followups.filter(fu => 
      fu.data.startsWith(mesAtual) && fu.status === 'Fechou pedido'
    );

    // Alertas baseados em performance
    if (visitasMes.length > 0) {
      const taxaConversao = (fechadosMes.length / visitasMes.length) * 100;
      
      if (taxaConversao < 10) {
        notifications.push({
          id: `meta_conversion_low_${Date.now()}`,
          type: 'meta_alert',
          title: 'Taxa de Conversão Baixa',
          message: `Taxa atual: ${taxaConversao.toFixed(1)}% - Considere revisar estratégia`,
          priority: 'medium',
          createdAt: now,
          isRead: false,
          actionLabel: 'Ver Dashboard'
        });
      }
    }

    return notifications;
  }, [visitas, followups]);

  // Atualizar notificações
  const updateNotifications = useCallback(() => {
    const followUpNotifications = generateFollowUpNotifications();
    const metaNotifications = generateMetaNotifications();
    
    const allNotifications = [
      ...followUpNotifications,
      ...metaNotifications
    ].sort((a, b) => {
      // Ordenar por prioridade e depois por data
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Identificar notificações novas
    const existingIds = new Set(notifications.map(n => n.id));
    const newNotifications = allNotifications.filter(n => !existingIds.has(n.id));

    // Enviar notificações do browser para novas notificações
    newNotifications.forEach(notification => {
      sendBrowserNotification(notification);
    });

    setNotifications(allNotifications);
  }, [notifications, generateFollowUpNotifications, generateMetaNotifications, sendBrowserNotification]);

  // Marcar notificação como lida
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, isRead: true }
          : n
      )
    );
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  // Remover notificação
  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Limpar todas as notificações
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Obter contadores
  const getStats = useCallback(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    const urgent = notifications.filter(n => n.priority === 'urgent' && !n.isRead).length;
    const followUpsDue = notifications.filter(n => 
      (n.type === 'follow_up_due' || n.type === 'follow_up_overdue') && !n.isRead
    ).length;

    return {
      total: notifications.length,
      unread,
      urgent,
      followUpsDue
    };
  }, [notifications]);

  // Verificar periodicamente por novas notificações
  useEffect(() => {
    updateNotifications();
    
    const interval = setInterval(() => {
      updateNotifications();
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [visitas, followups, options.followUpPrazo]);

  // Solicitar permissão quando componente montar
  useEffect(() => {
    if (options.enableBrowserNotifications && permission === 'default') {
      requestPermission();
    }
  }, [options.enableBrowserNotifications, permission, requestPermission]);

  return {
    notifications,
    stats: getStats(),
    permission,
    requestPermission,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    updateNotifications
  };
}