import { Button } from "./ui/button"
import { Level } from "./level"
import { LevelsPopup } from "./levels-popup";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { POINTS_TO_LEVEL, formatNumber } from "@/utils/utils";
import { Skeleton } from "./ui/skeleton";
import { API_ROOT, GET_REFERRAL_ID } from "@/utils/symmetry"
import toast from "react-hot-toast";
import { ClipboardIcon } from "@radix-ui/react-icons"

export const LevelWidgetMobile = () => {
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState(null);
  const [points, setPoints] = useState(null);
  const [user, setUser] = useState(null);

  const [referralId, setReferralId] = useState(null);

  useEffect(() => {
    if(wallet.connected) {
      GET_REFERRAL_ID(wallet.publicKey.toBase58()).then(ref => setReferralId(ref));
    }
  }, [wallet.connected]);

  useEffect(() => {
    let interval = null;
    if(wallet.connected) {
      refreshPoints();
      interval = setInterval(refreshPoints, 10000);
    }

    return () => {
      if(interval) clearInterval(interval);
    }
  }, [wallet.connected]);

  const refreshPoints = async () => {
    if(wallet.connected) {
      const userData = await fetch('https://api.symmetry.fi/v1/funds-getter', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request: "get_user",
          params: {
            pubkey: wallet.publicKey.toBase58()
          }
        })
      }).then(res => res.json()).then(data => {
        return data;
      });
      if(userData && userData.total_points) {
        setLevel(POINTS_TO_LEVEL(userData.total_points));
        setPoints(userData.total_points);
        setUser(userData);
      } else {
        setLevel(1);
        setPoints(0);
        setUser({
          total_points: 0,
          level: 1
        });
      }
    }
  }
  useEffect(() => {
    if(level) {
      let lvl = localStorage.getItem("level");
      if(lvl) {
        if(lvl < level) {
          localStorage.setItem("level", level);
          toast.success(<div className=" flex items-center gap-2">
            <Level level={level} size={48} className="rounded-full shadow-xl shadow-white"/>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold">Level Up!</p>
              <p className="text-xs text-muted-foreground">
                Congrats! You've reached level {level}
              </p>
            </div>
          </div>, {
            icon: false,
            duration: 5000,
            position:"top-center",
            ariaProps: {role:"status"},
          })
        }
      } else localStorage.setItem("level", level);
    }
  }, [level]);

  if(!wallet.connected) {
    return <></>
  }
  if(!level || points === null || !user) {
    return <Skeleton className="w-24 h-9"/>
  }
  return <div className="flex flex-col gap-2">
    <div className="flex flex-row items-center justify-between">
      <div className="flex items-center">
        <Level level={level} size={32}/>
        <p>Lvl {level}</p>
      </div>
      <div className="flex items-center gap-1">
        <p className="text-2xl shinyGold">
          {
            formatNumber(user.total_points,0)
          }
        </p>
      </div>
    </div>
    <Button variant={"secondary"} className="flex items-center gap-2" onClick={() => {
      navigator.clipboard.writeText("https://app.symmetry.fi/r/"+referralId);
      toast.success(<p className="text-sm">Referral link copied to clipboard</p>, { position: "top-center" });
    }}>
      <p className="text-xs">Copy referral link</p>
      <ClipboardIcon/>
    </Button>
  </div>
}