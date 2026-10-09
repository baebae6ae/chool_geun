package io.github.baebae6ae.hamsterworklog.widget;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** 예약해 둔 시각이 되면 위젯을 다시 그린다 */
public class WidgetTickReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        WidgetRenderer.updateAll(context);
    }
}
