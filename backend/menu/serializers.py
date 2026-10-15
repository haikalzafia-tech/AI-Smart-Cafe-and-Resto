from rest_framework import serializers

from .models import Menu


class MenuSerializer(serializers.ModelSerializer):
    suka = serializers.SerializerMethodField()
    tidak_suka = serializers.SerializerMethodField()

    class Meta:
        model = Menu
        fields = "__all__"

    def get_suka(self, obj):
        return getattr(obj, "jml_suka", 0)

    def get_tidak_suka(self, obj):
        return getattr(obj, "jml_tidak_suka", 0)
