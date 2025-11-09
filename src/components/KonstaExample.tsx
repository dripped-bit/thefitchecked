import React, { useState } from 'react';
import {
  App,
  Page,
  Navbar,
  Block,
  Button,
  List,
  ListItem,
  BlockTitle,
  Card,
  Chip,
  Dialog,
  DialogButton,
  Sheet,
  Tabbar,
  TabbarLink,
  Actions,
  ActionsGroup,
  ActionsButton,
  ActionsLabel,
  Toggle,
  Radio,
} from 'konsta/react';
import { Heart, ShoppingBag, User, Camera, Share2 } from 'lucide-react';

/**
 * Konsta UI Example Component for TheFitChecked
 *
 * This component demonstrates how to use Konsta UI's iOS-native components
 * in your app. Konsta UI provides beautiful iOS and Material Design components
 * that work seamlessly with Tailwind CSS.
 */

const KonstaExample: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState('casual');

  return (
    {/* App wrapper - required for Konsta UI, sets iOS theme */}
    <App theme="ios" safeAreas>
      <Page>
        {/* iOS-style Navbar */}
        <Navbar
          title="TheFitChecked"
          subtitle="iOS Native UI Demo"
          left={
            <Button inline onClick={() => window.history.back()}>
              Back
            </Button>
          }
          right={
            <Button inline onClick={() => setDialogOpen(true)}>
              Info
            </Button>
          }
        />

        {/* Main Content */}
        <BlockTitle>Outfit Actions</BlockTitle>
        <List strongIos insetIos>
          <ListItem
            link
            chevronIos
            title="Take Outfit Photo"
            media={<Camera className="text-blue-500" />}
          />
          <ListItem
            link
            chevronIos
            title="My Favorites"
            after={<Chip>12</Chip>}
            media={<Heart className="text-red-500" />}
          />
          <ListItem
            link
            chevronIos
            title="Shopping Cart"
            media={<ShoppingBag className="text-green-500" />}
          />
        </List>

        {/* Cards */}
        <BlockTitle>Today's Outfit</BlockTitle>
        <Block>
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Casual Summer Look</h3>
                <p className="text-gray-500 text-sm">Perfect for 72°F weather</p>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <Chip>Casual</Chip>
              <Chip>Summer</Chip>
              <Chip>Outdoor</Chip>
            </div>
            <Button rounded large>
              Try This Outfit
            </Button>
          </Card>
        </Block>

        {/* Buttons Demo */}
        <BlockTitle>Actions</BlockTitle>
        <Block className="space-y-2">
          <Button rounded large colors={{ fillIos: 'bg-blue-500' }}>
            Generate New Outfit
          </Button>
          <Button
            rounded
            large
            outline
            onClick={() => setSheetOpen(true)}
          >
            Open Sheet
          </Button>
          <Button
            rounded
            large
            clear
            onClick={() => setActionsOpen(true)}
          >
            More Options
          </Button>
        </Block>

        {/* Settings */}
        <BlockTitle>Settings</BlockTitle>
        <List strongIos insetIos>
          <ListItem
            label
            title="Outfit Notifications"
            after={
              <Toggle
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
            }
          />
          <ListItem
            label
            title="Default Style"
            after={
              <select
                className="bg-transparent text-blue-500"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
              >
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="sporty">Sporty</option>
                <option value="trendy">Trendy</option>
              </select>
            }
          />
        </List>

        {/* Dialog Example */}
        <Dialog
          opened={dialogOpen}
          onBackdropClick={() => setDialogOpen(false)}
          title="About TheFitChecked"
          content="This demo shows iOS-native UI components powered by Konsta UI. All components follow Apple's Human Interface Guidelines."
          buttons={
            <>
              <DialogButton onClick={() => setDialogOpen(false)}>
                Got it!
              </DialogButton>
            </>
          }
        />

        {/* Sheet Example */}
        <Sheet
          opened={sheetOpen}
          onBackdropClick={() => setSheetOpen(false)}
        >
          <div className="px-4 py-6">
            <BlockTitle>Choose Outfit Style</BlockTitle>
            <List>
              <ListItem
                label
                title="Casual"
                media={
                  <Radio
                    component="div"
                    checked={selectedStyle === 'casual'}
                    onChange={() => {
                      setSelectedStyle('casual');
                      setSheetOpen(false);
                    }}
                  />
                }
              />
              <ListItem
                label
                title="Formal"
                media={
                  <Radio
                    component="div"
                    checked={selectedStyle === 'formal'}
                    onChange={() => {
                      setSelectedStyle('formal');
                      setSheetOpen(false);
                    }}
                  />
                }
              />
              <ListItem
                label
                title="Sporty"
                media={
                  <Radio
                    component="div"
                    checked={selectedStyle === 'sporty'}
                    onChange={() => {
                      setSelectedStyle('sporty');
                      setSheetOpen(false);
                    }}
                  />
                }
              />
            </List>
          </div>
        </Sheet>

        {/* Actions Menu (iOS Action Sheet) */}
        <Actions
          opened={actionsOpen}
          onBackdropClick={() => setActionsOpen(false)}
        >
          <ActionsGroup>
            <ActionsLabel>Share Outfit</ActionsLabel>
            <ActionsButton bold>
              <Share2 className="mr-2" size={20} />
              Share to Instagram
            </ActionsButton>
            <ActionsButton>
              <Share2 className="mr-2" size={20} />
              Share to Messages
            </ActionsButton>
            <ActionsButton>
              <Share2 className="mr-2" size={20} />
              Copy Link
            </ActionsButton>
          </ActionsGroup>
          <ActionsGroup>
            <ActionsButton colors={{ text: 'text-red-500' }}>
              Cancel
            </ActionsButton>
          </ActionsGroup>
        </Actions>

        {/* iOS-style Tabbar */}
        <Tabbar labels icons className="left-0 bottom-0 fixed">
          <TabbarLink
            active
            icon={<Heart size={24} />}
            label="Outfits"
          />
          <TabbarLink
            icon={<Camera size={24} />}
            label="Camera"
          />
          <TabbarLink
            icon={<ShoppingBag size={24} />}
            label="Shop"
          />
          <TabbarLink
            icon={<User size={24} />}
            label="Profile"
          />
        </Tabbar>
      </Page>
    </App>
  );
};

export default KonstaExample;
