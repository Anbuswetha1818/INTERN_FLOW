"""
SIMS — Organization Hierarchy Views
Entities, Branches, Departments, Domains, Entity-Departments
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from ..models import Entity, Branch, Domain, EntityConfig
from ..serializers import (
    EntitySerializer, BranchSerializer,
    DomainSerializer, EntityHierarchySerializer,
    EntityConfigSerializer,
)
from ..permissions import IsSuperAdmin, IsSuperAdminOrManager, IsSMEOrAbove


class EntityListCreateView(APIView):
    """GET/POST /Sims/entities/"""
    permission_classes = [IsAuthenticated, IsSMEOrAbove]

    def get(self, request):
        profile = request.user.profile
        if profile.role == 'superadmin':
            queryset = Entity.objects.all()
        else:
            queryset = Entity.objects.filter(pk=profile.entity_id)
        serializer = EntitySerializer(queryset, many=True)
        
        # Sort in custom order: VDart Academy -> VDart Inc -> VDart Digital
        ORDER = {
            'internflow': 1,
            'internflow inc': 2,
            'internflow digital': 3,
            'sims academy': 1,
            'sims inc': 2,
            'sims digital': 3,
            'vdart academy': 1,
            'vdart inc': 2,
            'vdart digital': 3
        }
        sorted_data = sorted(serializer.data, key=lambda x: ORDER.get(x['name'].lower().strip(), 999))
        return Response(sorted_data)

    def post(self, request):
        if request.user.profile.role != 'superadmin':
            return Response({'error': 'Only Super Admin can create entities'}, status=status.HTTP_403_FORBIDDEN)
        serializer = EntitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        entity = serializer.save()
        # Create default config
        EntityConfig.objects.create(entity=entity)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EntityDetailView(APIView):
    """PATCH/DELETE /Sims/entities/{pk}/"""
    permission_classes = [IsAuthenticated, IsSuperAdminOrManager]

    def patch(self, request, pk):
        try:
            entity = Entity.objects.get(pk=pk)
            serializer = EntitySerializer(entity, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Entity.DoesNotExist:
            return Response({'error': 'Entity not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            entity = Entity.objects.get(pk=pk)
            entity.is_active = False
            entity.save()
            return Response({'message': 'Entity deactivated'})
        except Entity.DoesNotExist:
            return Response({'error': 'Entity not found'}, status=status.HTTP_404_NOT_FOUND)


class BranchListCreateView(APIView):
    """GET/POST /Sims/branches/"""
    permission_classes = [IsAuthenticated, IsSMEOrAbove]

    def get(self, request):
        profile = request.user.profile
        if profile.role == 'superadmin':
            queryset = Branch.objects.all()
        else:
            queryset = Branch.objects.filter(entity=profile.entity)
        serializer = BranchSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = BranchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BranchDetailView(APIView):
    """PATCH/DELETE /Sims/branches/{pk}/"""
    permission_classes = [IsAuthenticated, IsSuperAdminOrManager]

    def patch(self, request, pk):
        try:
            branch = Branch.objects.get(pk=pk)
            serializer = BranchSerializer(branch, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Branch.DoesNotExist:
            return Response({'error': 'Branch not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            branch = Branch.objects.get(pk=pk)
            branch.is_active = False
            branch.save()
            return Response({'message': 'Branch deactivated'})
        except Branch.DoesNotExist:
            return Response({'error': 'Branch not found'}, status=status.HTTP_404_NOT_FOUND)





class DomainListCreateView(APIView):
    """GET/POST /Sims/domains/"""

    def get_permissions(self):
        # Public GET so the InternOnboarding form can populate the dropdown
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        queryset = Domain.objects.filter(is_active=True)
        serializer = DomainSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DomainSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DomainDetailView(APIView):
    """GET/PATCH/DELETE /Sims/domains/{pk}/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            domain = Domain.objects.get(pk=pk)
            serializer = DomainSerializer(domain)
            return Response(serializer.data)
        except Domain.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            domain = Domain.objects.get(pk=pk)
            serializer = DomainSerializer(domain, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Domain.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            domain = Domain.objects.get(pk=pk)
            domain.is_active = False
            domain.save()
            return Response({'message': 'Domain deactivated'})
        except Domain.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)





class EntityHierarchyView(APIView):
    """GET /Sims/entity-hierarchy/ — Full hierarchy tree."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        if profile.role == 'superadmin':
            entities = Entity.objects.filter(is_active=True)
        else:
            entities = Entity.objects.filter(pk=profile.entity_id, is_active=True)
        serializer = EntityHierarchySerializer(entities, many=True)
        # Sort in custom order: VDart Academy -> VDart Inc -> VDart Digital
        ORDER = {
            'internflow': 1,
            'internflow inc': 2,
            'internflow digital': 3,
            'sims academy': 1,
            'sims inc': 2,
            'sims digital': 3,
            'vdart academy': 1,
            'vdart inc': 2,
            'vdart digital': 3
        }
        sorted_data = sorted(serializer.data, key=lambda x: ORDER.get(x['name'].lower().strip(), 999))
        return Response(sorted_data)


class EntityConfigView(APIView):
    """GET/PATCH /Sims/entity-config/{entity_id}/"""
    permission_classes = [IsAuthenticated, IsSMEOrAbove]

    def get(self, request, entity_id):
        config, _ = EntityConfig.objects.get_or_create(entity_id=entity_id)
        serializer = EntityConfigSerializer(config)
        return Response(serializer.data)

    def patch(self, request, entity_id):
        config, _ = EntityConfig.objects.get_or_create(entity_id=entity_id)
        serializer = EntityConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
