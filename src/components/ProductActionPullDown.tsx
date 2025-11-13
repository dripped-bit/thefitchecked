/**
 * Product Action Sheet
 * iOS-style action sheet that appears after user closes a product browser
 * Offers options to save to calendar or keep looking
 * Follows Apple HIG for action sheets
 */

import React from 'react';
import { Actions, ActionsGroup, ActionsButton, ActionsLabel } from 'konsta/react';

interface ProductActionPullDownProps {
  isOpen: boolean;
  onSaveToCalendar: () => void;
  onKeepLooking: () => void;
  productTitle?: string;
}

const ProductActionPullDown: React.FC<ProductActionPullDownProps> = ({
  isOpen,
  onSaveToCalendar,
  onKeepLooking,
  productTitle
}) => {
  return (
    <Actions
      opened={isOpen}
      onBackdropClick={onKeepLooking}
    >
      <ActionsGroup>
        <ActionsLabel>
          {productTitle 
            ? `You viewed a product. What would you like to do?` 
            : 'What would you like to do?'}
        </ActionsLabel>
        <ActionsButton
          bold
          onClick={onSaveToCalendar}
        >
          Save to Calendar
        </ActionsButton>
        <ActionsButton onClick={onKeepLooking}>
          Keep Looking
        </ActionsButton>
      </ActionsGroup>
      <ActionsGroup>
        <ActionsButton onClick={onKeepLooking}>
          Cancel
        </ActionsButton>
      </ActionsGroup>
    </Actions>
  );
};

export default ProductActionPullDown;
