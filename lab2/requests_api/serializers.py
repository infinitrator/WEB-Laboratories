import calendar
import re
from datetime import date

from django.utils import timezone

from rest_framework import serializers


def max_settlement_date(today):
    if today.month == 12:
        year, month = today.year + 1, 1
    else:
        year, month = today.year, today.month + 1
    return date(year, month, min(today.day, calendar.monthrange(year, month)[1]))


class StrictSerializer(serializers.Serializer):
    def to_internal_value(self, data):
        if not isinstance(data, dict):
            raise serializers.ValidationError({"non_field_errors": ["Ожидается JSON-объект."]})
        unknown = set(data) - set(self.fields)
        if unknown:
            raise serializers.ValidationError({field: ["Неизвестное поле."] for field in sorted(unknown)})
        return super().to_internal_value(data)


class StudentSerializer(StrictSerializer):
    fullName = serializers.CharField(max_length=120, trim_whitespace=True)
    group = serializers.RegexField(r"^[A-Z][1-4][1-5][0-9]{2}$", max_length=5)
    isuId = serializers.RegexField(r"^[1-9][0-9]{5}$", max_length=6)
    dormitory = serializers.IntegerField(min_value=1, max_value=20)
    room = serializers.IntegerField(min_value=100, max_value=599)
    settlementDate = serializers.DateField(format="%Y-%m-%d", input_formats=["%Y-%m-%d"])
    isForeign = serializers.BooleanField(required=False, default=False)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500, default="")

    def validate_fullName(self, value):
        value = " ".join(value.split())
        if not re.fullmatch(r"[A-Za-zА-Яа-яЁё]+(?:-[A-Za-zА-Яа-яЁё]+)*(?:\s+[A-Za-zА-Яа-яЁё]+(?:-[A-Za-zА-Яа-яЁё]+)*)+", value):
            raise serializers.ValidationError("Введите фамилию и имя буквами.")
        return value

    def validate_settlementDate(self, value):
        previous = self.context.get("previous")
        if previous and previous.get("settlementDate") == value.isoformat():
            return value
        today = timezone.localdate()
        if not today <= value <= max_settlement_date(today):
            raise serializers.ValidationError("Дата должна быть от сегодня до одного календарного месяца вперёд.")
        return value


class FilterSerializer(StrictSerializer):
    q = serializers.CharField(required=False, allow_blank=True, max_length=120)
    fullName = serializers.CharField(required=False, allow_blank=True, max_length=120)
    group = serializers.CharField(required=False, max_length=5)
    isuId = serializers.RegexField(r"^[1-9][0-9]{5}$", required=False)
    dormitory = serializers.IntegerField(required=False, min_value=1, max_value=20)
    room = serializers.IntegerField(required=False, min_value=100, max_value=599)
    settlementDate = serializers.DateField(required=False, input_formats=["%Y-%m-%d"])
    isForeign = serializers.BooleanField(required=False)

    def validate_group(self, value):
        if not re.fullmatch(r"[A-Z][1-4][1-5][0-9]{2}", value):
            raise serializers.ValidationError("Неверный формат группы.")
        return value
