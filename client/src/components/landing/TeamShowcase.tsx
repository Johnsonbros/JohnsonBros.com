import { Users, Award, Clock, Star, Shield, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  experience: string;
  certifications: string[];
  specialties: string[];
  image?: string;
  rating?: number;
  jobsCompleted?: number;
  bio?: string;
  contact?: {
    phone?: string;
    email?: string;
  };
}

interface TeamShowcaseProps {
  members?: TeamMember[];
  layout?: 'grid' | 'carousel' | 'featured';
  showStats?: boolean;
  showContact?: boolean;
  onBookWithTech?: (techId: string) => void;
}

const defaultMembers: TeamMember[] = [
  {
    id: "nate",
    name: "Nate Johnson",
    role: "Master Plumber",
    experience: "20+ years",
    certifications: ["Master License #ML2741", "EPA Certified", "OSHA Certified"],
    specialties: ["Commercial Plumbing", "Water Heaters", "Emergency Repairs"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nate",
    rating: 4.9,
    jobsCompleted: 2847,
    bio: "Leading our team with decades of experience in residential and commercial plumbing."
  },
  {
    id: "nick",
    name: "Nick Johnson",
    role: "Senior Plumber",
    experience: "15+ years",
    certifications: ["Journey License #JL8934", "Backflow Certified"],
    specialties: ["Drain Cleaning", "Pipe Repair", "Bathroom Remodels"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nick",
    rating: 4.8,
    jobsCompleted: 1932,
    bio: "Specializing in complex residential repairs and renovations."
  },
  {
    id: "jahz",
    name: "Jahz Williams",
    role: "Plumbing Technician",
    experience: "8+ years",
    certifications: ["Apprentice License #AL5621", "Safety Certified"],
    specialties: ["Leak Detection", "Fixture Installation", "Maintenance"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jahz",
    rating: 4.9,
    jobsCompleted: 873,
    bio: "Expert in modern plumbing technology and efficient problem-solving."
  }
];

export function TeamShowcase({
  members = defaultMembers,
  layout = 'grid',
  showStats = true,
  showContact = false,
  onBookWithTech
}: TeamShowcaseProps) {
  if (layout === 'featured') {
    const featured = members[0];
    const otherMembers = members.slice(1);

    return (
      <section className="py-16 bg-gradient-to-br from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-johnson-blue text-white">OUR EXPERTS</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Your Local Plumbers</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experienced, certified, and dedicated to solving your plumbing problems
            </p>
          </div>

          {/* Featured Member */}
          <div className="max-w-4xl mx-auto mb-12">
            <Card className="overflow-hidden shadow-xl">
              <div className="grid md:grid-cols-2">
                <div className="relative h-64 md:h-auto bg-gradient-to-br from-johnson-blue to-johnson-teal flex items-center justify-center">
                  <Avatar className="h-40 w-40 border-4 border-white shadow-2xl">
                    <AvatarImage src={featured.image} alt={featured.name} />
                    <AvatarFallback>{featured.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <Badge className="absolute top-4 right-4 bg-yellow-500 text-white">
                    <Award className="h-3 w-3 mr-1" />
                    Lead Expert
                  </Badge>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{featured.name}</h3>
                  <p className="text-johnson-blue font-medium mb-4">{featured.role}</p>
                  
                  <p className="text-gray-600 mb-6">{featured.bio}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Certifications:</p>
                      <div className="flex flex-wrap gap-2">
                        {featured.certifications.map((cert, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {showStats && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-lg font-bold text-johnson-blue">{featured.experience}</div>
                          <div className="text-xs text-gray-600">Experience</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-lg font-bold text-green-600">{featured.rating}★</div>
                          <div className="text-xs text-gray-600">Rating</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-lg font-bold text-orange-600">{featured.jobsCompleted}</div>
                          <div className="text-xs text-gray-600">Jobs</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {onBookWithTech && (
                    <Button 
                      className="mt-6 w-full bg-johnson-blue hover:bg-blue-700"
                      onClick={() => onBookWithTech(featured.id)}
                    >
                      Request {featured.name.split(' ')[0]}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Other Team Members */}
          <div className="grid md:grid-cols-2 gap-6">
            {otherMembers.map((member) => (
              <Card key={member.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={member.image} alt={member.name} />
                    <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{member.name}</h4>
                    <p className="text-sm text-johnson-blue">{member.role}</p>
                    <p className="text-sm text-gray-600 mt-2">{member.bio}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {member.experience}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {member.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Grid layout (default)
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-johnson-blue text-white">
            <Users className="h-3 w-3 mr-1" />
            MEET THE TEAM
          </Badge>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Expert Plumbers You Can Trust
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our certified technicians bring years of experience and dedication to every job
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map((member) => (
            <Card 
              key={member.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-200 group"
              data-testid={`team-member-${member.id}`}
            >
              {/* Header with Avatar */}
              <div className="bg-gradient-to-br from-johnson-blue to-johnson-teal p-6 text-white">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-3 border-white/20">
                    <AvatarImage src={member.image} alt={member.name} />
                    <AvatarFallback className="bg-white text-johnson-blue text-xl font-bold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <p className="text-blue-100">{member.role}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-sm">{member.experience}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                {member.bio && (
                  <p className="text-gray-600 mb-4 text-sm">{member.bio}</p>
                )}

                {/* Stats */}
                {showStats && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold text-gray-900">{member.rating}</span>
                      </div>
                      <div className="text-xs text-gray-600">Rating</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-bold text-gray-900">{member.jobsCompleted?.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Jobs Done</div>
                    </div>
                  </div>
                )}

                {/* Specialties */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Specialties:</p>
                  <div className="flex flex-wrap gap-1">
                    {member.specialties.slice(0, 3).map((specialty, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Certified:</p>
                  <div className="space-y-1">
                    {member.certifications.slice(0, 2).map((cert, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-xs text-gray-600">
                        <Shield className="h-3 w-3 text-green-600" />
                        <span>{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact/Book Button */}
                {onBookWithTech && (
                  <Button 
                    className="w-full mt-4 bg-johnson-blue hover:bg-blue-700 group-hover:bg-johnson-orange transition-colors"
                    onClick={() => onBookWithTech(member.id)}
                    data-testid={`book-with-${member.id}`}
                  >
                    Book with {member.name.split(' ')[0]}
                  </Button>
                )}

                {showContact && member.contact && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {member.contact.phone && (
                      <a href={`tel:${member.contact.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-johnson-blue">
                        <Phone className="h-3 w-3" />
                        {member.contact.phone}
                      </a>
                    )}
                    {member.contact.email && (
                      <a href={`mailto:${member.contact.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-johnson-blue">
                        <Mail className="h-3 w-3" />
                        {member.contact.email}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Team Stats Footer */}
        <div className="mt-12 p-6 bg-gradient-to-r from-johnson-blue/5 to-johnson-orange/5 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-johnson-blue">50+</div>
              <div className="text-sm text-gray-600">Years Combined Experience</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">15+</div>
              <div className="text-sm text-gray-600">Professional Certifications</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">5000+</div>
              <div className="text-sm text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">4.9★</div>
              <div className="text-sm text-gray-600">Team Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}