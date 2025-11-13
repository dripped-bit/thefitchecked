/**
 * Product Action Pull-Down Menu
 * iOS-style action sheet that appears after user closes a product browser
 * Offers options to save to calendar or keep looking
 */

import React from 'react';
import { Actions, ActionsGroup, ActionsButton, ActionsLabel } from 'konsta/react';
import { Calendar, Search } from 'lucide-react';

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
            ? `What would you like to do with this item?` 
            : 'What would you like to do?'}
        </ActionsLabel>
        <ActionsButton
          bold
          onClick={onSaveToCalendar}
        >
          <Calendar className="w-5 h-5 mr-2 inline" />
          Save to Calendar
        </ActionsButton>
        <ActionsButton onClick={onKeepLooking}>
          <Search className="w-5 h-5 mr-2 inline" />
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
