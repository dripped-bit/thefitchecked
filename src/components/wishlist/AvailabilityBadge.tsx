import React from 'react';
import { IonBadge, IonIcon } from '@ionic/react';
import { checkmarkCircle, alertCircle, closeCircle, timeOutline } from 'ionicons/icons';
import type { AvailabilityStatus } from '../../services/availabilityCheckerService';

interface AvailabilityBadgeProps {
  status: AvailabilityStatus;
  onClick?: () => void;
}

const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({ status, onClick }) => {
  const config = {
    in_stock: {
      icon: checkmarkCircle,
      color: 'success',
      text: 'In Stock',
    },
    low_stock: {
      icon: alertCircle,
      color: 'warning',
      text: 'Low Stock',
    },
    out_of_stock: {
      icon: closeCircle,
      color: 'danger',
      text: 'Out of Stock',
    },
    restocking: {
      icon: timeOutline,
      color: 'medium',
      text: 'Restocking',
    },
  };

  const { icon, color, text } = config[status] || config.in_stock;

  return (
    <IonBadge
      color={color}
      onClick={onClick}
      style={{
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '600',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <IonIcon icon={icon} style={{ marginRight: '4px', fontSize: '12px', verticalAlign: 'middle' }} />
      {text}
    </IonBadge>
  );
};

export default AvailabilityBadge;
