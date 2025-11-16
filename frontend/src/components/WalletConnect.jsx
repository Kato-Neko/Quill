import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Wallet, LogOut, Plus } from 'lucide-react';

export default function WalletConnect() {
  const { 
    address, 
    balance, 
    isConnecting, 
    isViewOnly,
    connectWallet, 
    connectManualAddress,
    disconnectWallet,
    getAvailableWallets
  } = useWallet();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  const handleConnectClick = () => {
    const availableWallets = getAvailableWallets();
    if (availableWallets.length === 0) {
      // No wallets, show manual input option
      setShowManualInput(true);
      setDialogOpen(true);
    } else if (availableWallets.length === 1) {
      // Only one wallet, connect directly
      connectWallet(availableWallets[0].name);
    } else {
      // Multiple wallets, show selection dialog
      setDialogOpen(true);
    }
  };

  const handleWalletSelect = (walletName) => {
    setDialogOpen(false);
    connectWallet(walletName);
  };

  const handleManualSubmit = () => {
    if (manualAddress.trim()) {
      connectManualAddress(manualAddress.trim());
      setDialogOpen(false);
      setManualAddress('');
      setShowManualInput(false);
    }
  };

  if (!address) {
    return (
      <>
        <Button onClick={handleConnectClick} disabled={isConnecting}>
          <Wallet className="mr-2" size={18} />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>
                Choose a wallet to connect or enter an address manually (view-only)
              </DialogDescription>
            </DialogHeader>
            
            {!showManualInput ? (
              <div className="space-y-2">
                {getAvailableWallets().map((wallet) => (
                  <Button
                    key={wallet.name}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleWalletSelect(wallet.name)}
                  >
                    <Wallet className="mr-2" size={18} />
                    {wallet.name}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setShowManualInput(true)}
                >
                  <Plus className="mr-2" size={18} />
                  Enter address manually (view-only)
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Cardano Address
                  </label>
                  <Input
                    placeholder="addr1..."
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleManualSubmit();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    View-only mode: You can view the address but cannot sign transactions
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              {showManualInput && (
                <>
                  <Button variant="outline" onClick={() => {
                    setShowManualInput(false);
                    setManualAddress('');
                  }}>
                    Back
                  </Button>
                  <Button onClick={handleManualSubmit}>
                    Connect
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-sm font-medium">{shortenAddress(address)}</div>
        <div className="text-xs text-gray-500">
          {isViewOnly ? 'View-only' : `${balance} ADA`}
        </div>
      </div>
      <Button onClick={disconnectWallet} variant="outline" size="sm">
        <LogOut size={14} />
      </Button>
    </div>
  );
}