package io.github.baebae6ae.hamsterworklog.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.os.Bundle;

/** 가로 위젯: 캐릭터 + 퇴근까지 남은 시간 + 오늘 번 돈 + 하루 진행 막대 */
public class HamsterWidgetWide extends AppWidgetProvider {
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
