export class WxAdHelper {
    private static rewardAd: any = null;
    private static adUnitId = "替换你的激励广告ID";
    private static isLoading = false;

    static showRewardAd(successCb: Function, failCb: Function) {
        const wx = (window as any).wx;
        if (!wx) {
            successCb();
            return;
        }

        if (!WxAdHelper.rewardAd) {
            try {
                WxAdHelper.rewardAd = wx.createRewardedVideoAd({ adUnitId: WxAdHelper.adUnitId });
            } catch (e) {
                console.error("广告实例创建失败", e);
                failCb();
                return;
            }
        }

        if (WxAdHelper.isLoading) {
            wx.showToast({ title: "广告加载中，请稍等" });
            failCb();
            return;
        }

        WxAdHelper.isLoading = true;
        WxAdHelper.rewardAd.load().then(() => {
            WxAdHelper.isLoading = false;
            WxAdHelper.rewardAd.show().catch(() => {
                WxAdHelper.rewardAd.load();
            });
        }).catch(() => {
            WxAdHelper.isLoading = false;
            failCb();
        });

        WxAdHelper.rewardAd.offClose();
        WxAdHelper.rewardAd.onClose((res: any) => {
            if (res && res.isEnded) {
                successCb();
            } else {
                failCb();
            }
        });
    }
}