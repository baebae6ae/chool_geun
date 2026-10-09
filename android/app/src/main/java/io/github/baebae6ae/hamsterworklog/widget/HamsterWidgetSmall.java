package io.github.baebae6ae.hamsterworklog.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.os.Bundle;

/** 작은 위젯: 캐릭터 + 남은 시간 + 한 줄 상태 */
public class HamsterWidgetSmall extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        WidgetRenderer.updateAll(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) {
        WidgetRenderer.updateAll(context);
    }

    @Override
    public void onDisabled(Context context) {
        WidgetRenderer.updateAll(context);
    }
}
