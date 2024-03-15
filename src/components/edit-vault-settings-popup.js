import { ArrowTopRightIcon, MagnifyingGlassIcon, TrashIcon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import { useSymmetry } from "@/utils/SymmetryContext"
import toast from "react-hot-toast"
import { PublicKey } from "@solana/web3.js"
import { useSelector } from "react-redux"
import { Label } from "./ui/label"
import { Slider } from "./ui/slider"

export const EditVaultSettingsPopup = ({open, onClose, setReload, reload, basket=null}) => {
  const sdk = useSymmetry();
  const wallet = useWallet();
  const state = useSelector(state => state.storage);
  const [basketComposition, setBasketComposition] = useState([]);
  const [tokensPopup, setTokensPopup] = useState(false);
  const [basketSettings, setBasketSettings] = useState({
    managerFee: 0,
    rebalanceInterval: 0,
    rebalanceThreshold: 0,
    rebalanceSlippage: 0,
    lpOffsetThreshold: 0,
    disableRebalance: 0,
    disableLp: 0
  });

  useEffect(() => {
    if(basket && basket.parsed) {
      let comp = [];
      basket.parsed.currentComposition.map(token => {
        if (token.targetWeight > 0)
          comp.push({
            ...token.tokenData,
            weight: parseFloat(token.targetWeight.toFixed(2))
          })
      })
      setBasketComposition(comp);
      setBasketSettings({
        managerFee: basket.basket.data.managerFee.toNumber(),
        rebalanceInterval: basket.basket.data.rebalanceInterval.toNumber(),
        rebalanceThreshold: basket.basket.data.rebalanceThreshold.toNumber(),
        rebalanceSlippage: basket.basket.data.rebalanceSlippage.toNumber(),
        lpOffsetThreshold: basket.basket.data.lpOffsetThreshold.toNumber(),
        disableRebalance: basket.basket.data.disableRebalance.toNumber(),
        disableLp: basket.basket.data.disableLp.toNumber()
      });
    }
  }, [basket]);

  const addToken = (token) => {
    // check if token already in composition
    let exists = basketComposition.find(t => t.tokenMint === token.tokenMint);
    if(exists) {
      toast.error("Token already in composition");
      setTokensPopup(false);
      return;
    }
    setBasketComposition([...basketComposition, {
      ...token,
      weight: 0
    }]);
    setTokensPopup(false);
  }
  const removeToken = (token) => {
    let newTokens = basketComposition.filter(t => t.tokenMint !== token.tokenMint);
    setBasketComposition(newTokens);
  }

  const adjustTokenWeight = (token, weight) => {
    let newTokens = basketComposition.map(t => {
      if(t.tokenMint === token.tokenMint) {
        return {
          ...t,
          weight: Number(weight)
        }
      }
      return t;
    });
    setBasketComposition(newTokens);
  }

  const editHoldings = async () => {
    sdk.setWallet(wallet);
    sdk.setPriorityFee(500000);
    toast.loading("Waiting for transaction...",{id: 2});
    sdk.simpleEditBasket(basket.basket, {
      managerFee: basketSettings.managerFee,
      rebalanceInterval: basketSettings.rebalanceInterval,
      rebalanceThreshold: basketSettings.rebalanceThreshold,
      rebalanceSlippage: basketSettings.rebalanceSlippage,
      lpOffsetThreshold: basketSettings.lpOffsetThreshold,
      disableRebalance: basket.basket.data.disableRebalance.toNumber(),
      disableLp: basket.basket.data.disableLp.toNumber(),
      composition: basketComposition.map(x => { return {token: new PublicKey(x.tokenMint), weight: x.weight}})
    }).catch((e) => {
      toast.error(e.message, {id: 2});
      return null
    }).then(tx => {
      if (tx) {
        toast.success(<a href={"https://solscan.io/tx/"+tx}>View on Solscan</a>, {id: 2});
      }
      setReload(reload+1);
    })
  }


  return <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit Settings</DialogTitle>
        <DialogDescription>
          Adjust advanced settings which affect the behavior of the basket.
        </DialogDescription>
      </DialogHeader>
      <div>
        <Label htmlFor="aum" className="text-xs text-muted-foreground">Manager Fee</Label>
        <input className="w-full h-12 rounded-md border bg-background p-4" value={basketSettings.managerFee} onChange={(e) => setBasketSettings(settings => ({...settings, managerFee: e.target.value }))} placeholder="My Portfolio"/>
        <p className="text-xs text-muted-foreground">The fee charged by the manager, equal to {basketSettings.managerFee/100}%</p>
      </div>
      <div>
        <Label htmlFor="aum" className="text-xs text-muted-foreground">Rebalance Interval</Label>
        <input className="w-full h-12 rounded-md border bg-background p-4" value={basketSettings.rebalanceInterval} onChange={(e) => setBasketSettings(settings => ({...settings, rebalanceInterval: e.target.value }))} placeholder="My Portfolio"/>
        <Slider min={3600} max={129600} step={3600} value={[basketSettings.rebalanceInterval]} onValueChange={(e) => setBasketSettings(settings => ({...settings, rebalanceInterval: e }))} />
        <p className="text-xs text-muted-foreground">The interval at which the basket is rebalanced, equal to {Math.round(basketSettings.rebalanceInterval/3600)} hours.</p>
      </div>
      <div>
        <Label htmlFor="aum" className="text-xs text-muted-foreground">Rebalance Threshold</Label>
        <input className="w-full h-12 rounded-md border bg-background p-4" value={basketSettings.rebalanceThreshold} onChange={(e) => setBasketSettings(settings => ({...settings, rebalanceThreshold: e.target.value }))} placeholder="My Portfolio"/>
        <p className="text-xs text-muted-foreground">The threshold at which the basket is rebalanced, equal to {basketSettings.rebalanceThreshold/100}%</p>
      </div>
      <div>
        <Label htmlFor="aum" className="text-xs text-muted-foreground">Rebalance Slippage</Label>
        <input className="w-full h-12 rounded-md border bg-background p-4" value={basketSettings.rebalanceSlippage} onChange={(e) => setBasketSettings(settings => ({...settings, rebalanceSlippage: e.target.value }))} placeholder="My Portfolio"/>
        <p className="text-xs text-muted-foreground">The slippage tolerance, equal to {basketSettings.rebalanceSlippage/100}%</p>
      </div>
      <div>
        <Label htmlFor="aum" className="text-xs text-muted-foreground">Liquidity Injection Range</Label>
        <input className="w-full h-12 rounded-md border bg-background p-4" value={basketSettings.lpOffsetThreshold} onChange={(e) => setBasketSettings(settings => ({...settings, lpOffsetThreshold: e.target.value }))} placeholder="My Portfolio"/>
        <p className="text-xs text-muted-foreground">Liquidity range, equal to {basketSettings.lpOffsetThreshold/100}%</p>
      </div>
      <DialogFooter>
        <Button onClick={() => editHoldings()}>Save changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}