{{/*
Helpers Valoria
*/}}

{{- define "valoria.labels" -}}
app.kubernetes.io/part-of: Valoria
{{- end -}}

{{- define "valoria.namespace" -}}
{{- .Values.namespace | default "valoria" -}}
{{- end -}}
