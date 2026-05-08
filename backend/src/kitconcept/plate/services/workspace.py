from plone.restapi.interfaces import IExpandableElement
from plone.restapi.services import Service
from zope.component import adapter
from zope.interface import Interface
from zope.interface import implementer


@implementer(IExpandableElement)
@adapter(Interface, Interface)
class WorkspaceExpander:
    def __init__(self, context, request):
        self.context = context
        self.request = request

    def __call__(self, expand=False):
        if not expand:
            return {"workspace": {"@id": f"{self.context.absolute_url()}/@workspace"}}

        for obj in self.context.aq_chain:
            if getattr(obj, "portal_type", None) == "Workspace":
                return {"workspace": {"url": obj.absolute_url()}}

        return {"workspace": {"url": None}}


class WorkspaceGet(Service):
    def reply(self):
        workspace = WorkspaceExpander(self.context, self.request)
        return workspace(expand=True)["workspace"]
