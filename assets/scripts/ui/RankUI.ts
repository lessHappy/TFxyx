import { _decorator, Component, Label, Button, ScrollView, Node, instantiate } from 'cc';
import { StorageUtil } from '../core/StorageUtil';
const { ccclass, property } = _decorator;

interface RankRecord{
    kill:number;
    time:number;
    gold:number;
}
const RANK_KEY = "game_rank_data";
const MAX_RANK_NUM = 10;

@ccclass("RankUI")
export class RankUI extends Component {
    @property(ScrollView) scroll:ScrollView = null!;
    @property(Node) itemPrefab:Node = null!;
    @property(Button) closeBtn:Button = null!;

    private recordList:RankRecord[] = [];

    onLoad(){
        this.closeBtn.node.on(Button.Event.CLICK, ()=>this.node.active = false);
        this.node.active = false;
    }

    show(){
        this.node.active = true;
        this.loadRankData();
        this.refreshUI();
    }

    //保存新对局记录，战斗结束调用
    static saveRecord(record:RankRecord){
        const list:RankRecord[] = StorageUtil.getObject(RANK_KEY, []);
        list.push(record);
        //按生存时间降序排序
        list.sort((a,b)=>b.time - a.time);
        if(list.length > MAX_RANK_NUM) list.length = MAX_RANK_NUM;
        StorageUtil.setObject(RANK_KEY, list);
    }

    loadRankData(){
        this.recordList = StorageUtil.getObject(RANK_KEY, []);
    }

    refreshUI(){
        const content = this.scroll.content!;
        content.removeAllChildren();
        for(let i=0; i<this.recordList.length; i++){
            const data = this.recordList[i];
            const clone = instantiate(this.itemPrefab);
            clone.active = true;
            clone.setParent(content);
            const labels = clone.getComponentsInChildren(Label);
            const min = Math.floor(data.time/60);
            const sec = Math.floor(data.time%60);
            labels[0].string = `第${i+1}名`;
            labels[1].string = `击杀:${data.kill}`;
            labels[2].string = `时间:${min}:${sec}`;
            labels[3].string = `金币:${data.gold}`;
        }
    }
}